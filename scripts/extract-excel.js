const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'HelpDaskApps.xlsx');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetNames = workbook.SheetNames;

console.log("Sheets found:", sheetNames);

const data = {};

sheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    data[sheetName] = jsonData;
    console.log(`\n--- Sheet: ${sheetName} (First 3 rows) ---`);
    console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
});

// Save complete data to a temp file for me to read if it's too large for console
fs.writeFileSync(path.join(__dirname, 'temp_excel_data.json'), JSON.stringify(data, null, 2));
console.log("\nFull data saved to scripts/temp_excel_data.json");
