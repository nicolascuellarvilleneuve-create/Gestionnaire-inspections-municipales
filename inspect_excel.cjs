
const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile("grille d'inspection.xlsx");
    console.log("Sheets:", workbook.SheetNames);
    const sheetName = 'marge';
    console.log(`Reading sheet: ${sheetName}`);

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));

    // Also save it to a file so we can read it fully if needed
    fs.writeFileSync('extracted_data.json', JSON.stringify(jsonData, null, 2));

} catch (e) {
    console.error("Error reading excel:", e);
}
