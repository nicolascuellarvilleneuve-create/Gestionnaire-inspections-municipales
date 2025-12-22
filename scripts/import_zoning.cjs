const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_PATH = "grille d'inspection.xlsx";
const OUTPUT_PATH = path.join('src', 'data', 'zoningData.json');

function importZoning() {
    console.log("Loading Excel:", FILE_PATH);
    const workbook = XLSX.readFile(FILE_PATH);

    const zones = {}; // Map<ZoneName, DataObject>

    // 1. Process "Liste" Sheet (Standard Table)
    const listSheet = workbook.Sheets['Liste'];
    if (listSheet) {
        const listData = XLSX.utils.sheet_to_json(listSheet);
        console.log(`Processing 'Liste': ${listData.length} rows`);

        listData.forEach(row => {
            const zoneName = row['Zone'];
            if (zoneName) {
                // Normalize keys basic
                zones[zoneName] = {
                    zone: zoneName,
                    type_terrain: row['Type de terrain'],
                    adjacency_residential: row['Adjac. ter. res.'],
                    reseau: row['Réseau'],
                    type_toit: row['Type de toit'],
                    type_batiment_compl: row['type batiment compl.'],
                    entreposage: row['entreposage'],
                    mat_mur_prohibe: row['matériaux revêtement murale prohibé '],
                    mat_toit_permis: row['matériaux revêtement toiture autorisés'],
                    mat_bordure: row['matériaux bordure'],
                    notes: []
                };
            }
        });
    }

    // 2. Process "marge" Sheet (Transposed / Pivot)
    const margeSheet = workbook.Sheets['marge'];
    if (margeSheet) {
        const margeData = XLSX.utils.sheet_to_json(margeSheet);
        console.log(`Processing 'marge': ${margeData.length} rows`);

        // Row 0: Marge avant
        // Row 1: Marge arrière
        // Row 2: Marge latérale (min one side)
        // Row 3: Marge latérale combiné (total)
        // Row 4: Type d'entreposage (Duplicate info?)

        margeData.forEach((row, index) => {
            // Identify rule type 
            // The first key is usually "Zone" holding the label, e.g. "Marge avant "
            // BUT sheet_to_json uses the first row as keys.
            // Wait, looking at the dump:
            // "Zone": "Marge avant ", "604-Ia": 15 ...
            // So 'Zone' property holds the Label.

            const label = row['Zone'] ? row['Zone'].trim() : '';

            // Keys are "604-Ia", "632-Ib", etc.
            const zoneKeys = Object.keys(row).filter(k => k !== 'Zone');

            zoneKeys.forEach(zoneKey => {
                if (!zones[zoneKey]) {
                    // Create if missing (maybe not in Liste?)
                    zones[zoneKey] = { zone: zoneKey };
                }

                const val = row[zoneKey];

                // Map based on Label or Index
                if (label.includes("Marge avant")) {
                    zones[zoneKey].marge_avant = val;
                } else if (label.includes("Marge arrière")) {
                    zones[zoneKey].marge_arriere = val;
                } else if (label.includes("Marge latérale combiné")) {
                    // PROBLEM: Two rows have similar labels.
                    // Row 2 (Index 2 in 0-based dump?) is "Marge latérale combiné " -> The one with smaller values (4, 6) -> Marge Latérale Min (One Side)
                    // Row 3 (Index 3) is "Marge latérale combiné " -> The one with larger values (10, 12) -> Marge Latérale Totale

                    // We can use the array index from forEach to differentiate
                    // Based on my dump step 309:
                    // Index 2: values ~6. This is One Side.
                    // Index 3: values ~12. This is Combined.

                    // NOTE: This logic assumes ROW ORDER is preserved.
                    if (index === 2) {
                        zones[zoneKey].marge_laterale = val;
                    } else if (index === 3) {
                        zones[zoneKey].marge_laterale_combinee = val;
                    }
                } else if (label.includes("type d'entreposage")) {
                    zones[zoneKey].nature_entreposage = val; // Overwrites 'entreposage' from Liste? Or complements?
                }
            });
        });
    }

    // Convert to Array
    const outputArray = Object.values(zones);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputArray, null, 2));
    console.log(`Saved ${outputArray.length} zones to ${OUTPUT_PATH}`);
}

importZoning();
