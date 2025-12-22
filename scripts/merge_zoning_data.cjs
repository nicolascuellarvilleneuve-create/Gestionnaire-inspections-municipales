const fs = require('fs');
const path = require('path');

const originalDataPath = path.join(__dirname, '../src/data/zoningData.json');
const pdfDataPath = path.join(__dirname, '../src/data/residentialZoningData.json');

if (!fs.existsSync(originalDataPath) || !fs.existsSync(pdfDataPath)) {
    console.error("One or more data files missing.");
    process.exit(1);
}

const originalData = JSON.parse(fs.readFileSync(originalDataPath, 'utf8'));
const pdfData = JSON.parse(fs.readFileSync(pdfDataPath, 'utf8'));

// Convert camelCase to snake_case map
const keyMap = {
    "margeAvant": "marge_avant",
    "margeArriere": "marge_arriere",
    "margeLaterale": "marge_laterale",
    "margeLateraleCombinee": "marge_laterale_combinee",
    "dominante": "dominante",
    "usages": "usages" // Keep as is
};

let updatedCount = 0;
let newCount = 0;

Object.keys(pdfData).forEach(pdfZone => {
    const norms = pdfData[pdfZone];

    // Convert norms to snake_case
    const snakeNorms = {};
    Object.keys(norms).forEach(k => {
        if (keyMap[k]) {
            let val = norms[k];
            // Convert numeric strings to numbers if possible, EXCEPT for specific fields
            if (k === 'usages') {
                snakeNorms[keyMap[k]] = val; // Keep array
            } else if (k === 'dominante') {
                snakeNorms[keyMap[k]] = val; // Keep string
            } else {
                if (!isNaN(parseFloat(val)) && isFinite(val)) {
                    snakeNorms[keyMap[k]] = parseFloat(val);
                } else {
                    snakeNorms[keyMap[k]] = val;
                }
            }
        }
    });

    // Find matching zones in originalData
    const matches = originalData.filter(item =>
        item.zone === pdfZone || item.zone.startsWith(pdfZone + "-")
    );

    if (matches.length > 0) {
        // Update existing
        matches.forEach(match => {
            Object.assign(match, snakeNorms);
            updatedCount++;
        });
    } else {
        // Add new zone
        const newEntry = {
            zone: pdfZone,
            ...snakeNorms,
            notes: []
        };
        originalData.push(newEntry);
        newCount++;
    }
});

// Sort data by zone name
originalData.sort((a, b) => a.zone.localeCompare(b.zone, undefined, { numeric: true, sensitivity: 'base' }));

fs.writeFileSync(originalDataPath, JSON.stringify(originalData, null, 2));

console.log(`Merged complete. Updated ${updatedCount} entries. Added ${newCount} new entries.`);
