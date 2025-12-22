const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Input/Output paths
const pdfPath = path.join(__dirname, '../docs/2014-14_GRILLES_REFONDUES.pdf');
const outputPath = path.join(__dirname, '../src/data/residentialZoningData.json');

if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

function isHeaderRow(items) {
    const potentialZones = items.filter(i => /^[0-9]{3}$|^[A-Z]+-[a-z0-9]+$/i.test(i.str.trim()) || /^[0-9]{3}[A-Z]*$/i.test(i.str.trim()));
    return potentialZones.length >= 2;
}

async function extractData() {
    const zonesData = {};

    function render_page(pageData) {
        let render_options = {
            normalizeWhitespace: false,
            disableCombineTextItems: true
        }

        return pageData.getTextContent(render_options)
            .then(function (textContent) {
                let items = textContent.items.map(item => ({
                    str: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    w: item.width
                }));
                return "<<<PAGE_START>>>" + JSON.stringify(items) + "<<<PAGE_END>>>";
            });
    }

    let options = {
        pagerender: render_page
    }

    const data = await pdf(dataBuffer, options);

    // Extract pages
    const pagesRaw = [];
    const regex = /<<<PAGE_START>>>([\s\S]*?)<<<PAGE_END>>>/g;
    let match;
    while ((match = regex.exec(data.text)) !== null) {
        try {
            pagesRaw.push(JSON.parse(match[1]));
        } catch (e) {
            console.error("Failed to parse page JSON:", e);
        }
    }

    console.log(`Parsed ${pagesRaw.length} pages of JSON data.`);

    pagesRaw.forEach((items, pageIndex) => {
        // Group by Y (Fuzzy)
        // Sort by Y desc
        items.sort((a, b) => b.y - a.y);

        const rows = [];
        let currentRow = [];
        let currentY = -999;

        // Simple clustering
        items.forEach(item => {
            if (currentRow.length === 0) {
                currentRow.push(item);
                currentY = item.y;
            } else {
                if (Math.abs(item.y - currentY) < 4.0) { // Tolerance 4 units
                    currentRow.push(item);
                } else {
                    rows.push({ y: currentY, items: currentRow });
                    currentRow = [item];
                    currentY = item.y;
                }
            }
        });
        if (currentRow.length > 0) {
            rows.push({ y: currentY, items: currentRow });
        }

        let currentZones = [];
        let headerRowIndex = -1;

        // Find Header Row
        for (let i = 0; i < rows.length; i++) {
            const rowObj = rows[i];
            let rowItems = rowObj.items.sort((a, b) => a.x - b.x);

            // Pre-process: Split monolithic header strings
            const expandedItems = [];
            rowItems.forEach(item => {
                const str = item.str;
                const zonePattern = /[A-Z0-9]+-[a-z0-9]+|\b[0-9]{3}\b|\b[A-Z]{1,3}-[a-z]\b|\b[0-9]{3}[A-Z]?\b|H-[a-z]/g;
                const matches = [...str.matchAll(zonePattern)];

                if (matches.length > 1) {
                    const width = item.w;
                    const len = str.length;
                    const charW = width / len;

                    matches.forEach(m => {
                        const matchStr = m[0];
                        const matchIndex = m.index;
                        const subX = item.x + (matchIndex * charW) + (matchStr.length * charW / 2);
                        expandedItems.push({ str: matchStr, x: subX - (matchStr.length * charW / 2), w: matchStr.length * charW });
                    });
                } else {
                    expandedItems.push(item);
                }
            });
            rowItems = expandedItems;

            if (isHeaderRow(rowItems)) {
                currentZones = rowItems.filter(i => /^[0-9]{3}$|^[A-Z]+-[a-z0-9]+$/i.test(i.str.trim()) || /^[A-Z]{1,2}-[a-z]$/.test(i.str.trim()))
                    .map(i => ({ name: i.str.trim(), x: i.x + (i.w / 2) }));
                headerRowIndex = i;
                console.log(`Page ${pageIndex + 1}: Found zones: ${currentZones.map(z => z.name).join(', ')}`);
                break;
            }
        }

        if (currentZones.length === 0) return;

        let currentGroup = "AUTRE"; // Default group if none found

        // Process data rows below header
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const rowObj = rows[i];
            const rowItems = rowObj.items.sort((a, b) => a.x - b.x);
            const firstText = rowItems[0]?.str.trim() || "";

            // --- 0. GROUP HEADER DETECTION ---
            // If row looks like a Group Header (e.g. HABITATION, COMMERCE, etc.)
            // usually these are standalone strings in the first column or so.
            // Using a strict list of known groups
            const groupMatch = firstText.match(/^(HABITATION|COMMERCE|INDUSTRIE|RÉCRÉATION|PUBLIC|INSTITUT|AGRICOLE|MIXTE|FORESTIER|CONSERVATION)/i);

            // Avoid confusing with usages like "HABITATION (H-a)" if that exists.
            // The header is usually just "HABITATION" or "COMMERCE ET SERVICE"
            // And typically has no other data on the row (except maybe page number?)
            if (groupMatch && !firstText.includes("Marge") && !firstText.includes("Hauteur")) {
                // It is a group header
                currentGroup = firstText.replace(/:/g, '').trim().toUpperCase();
                // Normalize "COMMERCE ET SERVICE" -> "COMMERCE" if needed, 
                // but user wants "Groupe", so keeping full name is fine.
                // Clean up newlines or extra spaces
                currentGroup = currentGroup.replace(/\s+/g, ' ');
                continue; // Skip processing this row as data
            }

            // --- 1. USAGE MATRIX EXTRACTION ---
            // Pattern: Starts with Usage Code (e.g. "H-a", "REC-b", "C-a") 
            const usageCodeMatch = firstText.match(/^([A-Z]{1,4}-[a-z0-9]+|[A-Z]{2})\b/); // e.g. REC-b, CN

            if (usageCodeMatch && !firstText.includes("Marge") && !firstText.includes("Hauteur")) {
                const usageCode = usageCodeMatch[0]; // Full match

                // Look for 'X' or 'x' markers
                const valueItems = rowItems.filter(item => item.x > 200);

                valueItems.forEach(vItem => {
                    const text = vItem.str;
                    const len = text.length;
                    const startX = vItem.x;
                    const width = vItem.w;
                    const charW = width / len;

                    for (let c = 0; c < len; c++) {
                        const charX = startX + (c * charW) + (charW / 2);
                        const charVal = text[c];

                        if (charVal === 'X' || charVal === 'x') {
                            // Find corresponding zone
                            let closestZone = null;
                            let minDist = Infinity;
                            currentZones.forEach(z => {
                                const dist = Math.abs(z.x - charX);
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestZone = z;
                                }
                            });

                            if (closestZone && minDist < 45) {
                                if (!zonesData[closestZone.name]) zonesData[closestZone.name] = {};
                                if (!zonesData[closestZone.name].usages) zonesData[closestZone.name].usages = [];

                                // Store Usage Object { code: "REC-b", group: "RÉCRÉATION" }
                                // Check if already exists
                                const exists = zonesData[closestZone.name].usages.some(u => u.code === usageCode);
                                if (!exists) {
                                    zonesData[closestZone.name].usages.push({
                                        code: usageCode,
                                        group: currentGroup
                                    });
                                }
                            }
                        }
                    }
                });
            }

            // --- 2. DOMINANCE EXTRACTION ---
            const possibleDominance = ["H", "C", "I", "P", "REC", "Ag", "RN", "CN", "MIX", "PUB"];
            const isDominanceRow = rowItems.some(item => item.x > 200 && possibleDominance.includes(item.str.trim()));

            if (isDominanceRow && !firstText.includes("Marge") && !firstText.includes("Hauteur") && !usageCodeMatch) {
                const dominanceItems = rowItems.filter(item => item.x > 200);
                dominanceItems.forEach(vItem => {
                    const text = vItem.str.trim();
                    if (possibleDominance.includes(text)) {
                        const centerX = vItem.x + (vItem.w / 2);
                        let closestZone = null;
                        let minDist = Infinity;
                        currentZones.forEach(z => {
                            const dist = Math.abs(z.x - centerX);
                            if (dist < minDist) {
                                minDist = dist;
                                closestZone = z;
                            }
                        });

                        if (closestZone && minDist < 45) {
                            if (!zonesData[closestZone.name]) zonesData[closestZone.name] = {};
                            zonesData[closestZone.name].dominante = text;
                        }
                    }
                });
            }

            // --- 3. MARGINS EXTRACTION ---
            let key = null;
            if (firstText.includes("Marge de recul avant")) key = "margeAvant";
            else if (firstText.includes("Marge de recul arrière")) key = "margeArriere";
            else if (firstText.includes("Marge de recul latérale")) key = "margeLaterale";
            else if (firstText.includes("Largeur combinée") || firstText.includes("Somme des marges")) key = "margeLateraleCombinee";

            if (key) {
                const valueItems = rowItems.filter(item => item.x > 200);

                valueItems.forEach(vItem => {
                    const text = vItem.str;
                    const len = text.length;
                    const startX = vItem.x;
                    const width = vItem.w;
                    const charW = width / len;

                    for (let c = 0; c < len; c++) {
                        const charX = startX + (c * charW) + (charW / 2);
                        const charVal = text[c];

                        let closestZone = null;
                        let minDist = Infinity;

                        currentZones.forEach(z => {
                            const dist = Math.abs(z.x - charX);
                            if (dist < minDist) {
                                minDist = dist;
                                closestZone = z;
                            }
                        });

                        if (closestZone && minDist < 55) {
                            if (!zonesData[closestZone.name]) zonesData[closestZone.name] = {};
                            if (!zonesData[closestZone.name][key]) zonesData[closestZone.name][key] = "";
                            zonesData[closestZone.name][key] += charVal;
                        }
                    }
                });
            }
        }
    });

    for (const z in zonesData) {
        for (const k in zonesData[z]) {
            if (k === 'usages' || k === 'dominante') continue;

            let val = zonesData[z][k].trim();
            val = val.replace(',', '.');
            zonesData[z][k] = val;
        }
    }

    console.log("Extraction complete. Saving to JSON.");
    fs.writeFileSync(outputPath, JSON.stringify(zonesData, null, 2));
}

extractData().catch(console.error);
