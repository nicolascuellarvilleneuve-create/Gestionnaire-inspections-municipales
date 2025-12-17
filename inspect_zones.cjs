
const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile("grille d'inspection.xlsx");

    // Extract 'Marge' sheet
    // Note: The user said "Marge", let's list sheet names to be sure closer to it if exact match fails
    console.log("Sheet Names:", workbook.SheetNames);

    // Try to find a sheet that looks like "Marge"
    const margeSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('marge')) || workbook.SheetNames[0];
    console.log(`Reading sheet for ZONES: ${margeSheetName}`);

    const worksheet = workbook.Sheets[margeSheetName];
    // Convert to JSON (array of arrays to see structure first, or array of objects)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Header: 1 gives array of arrays

    console.log("Top 5 rows:");
    console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));

    fs.writeFileSync('extracted_zones_raw.json', JSON.stringify(jsonData, null, 2));

} catch (e) {
    console.error("Error reading excel:", e);
}
