
const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile("grille d'inspection.xlsx");

    console.log("Sheet Names:", workbook.SheetNames);

    // Try to find a sheet that looks like "Marge"
    const margeSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('marge')) || workbook.SheetNames[0];
    console.log(`Reading sheet for ZONES: ${margeSheetName}`);

    const worksheet = workbook.Sheets[margeSheetName];
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

    console.log("Top 10 rows:");
    console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));

    fs.writeFileSync('extracted_zones_raw.json', JSON.stringify(jsonData, null, 2));

} catch (e) {
    console.error("Error reading excel:", e);
}
