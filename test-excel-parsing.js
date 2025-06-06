// Test script to verify Excel parsing logic
const xlsx = require('xlsx');
const path = require('path');

console.log('Testing Excel parsing with miniTest.xlsx');
console.log('=====================================');

try {
  // Read the Excel file
  const filePath = path.join(__dirname, 'neuralScripts', 'miniTest.xlsx');
  console.log('Reading file:', filePath);
  
  const workbook = xlsx.readFile(filePath);
  console.log('Workbook sheets:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('Raw data from Excel:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nNumber of rows:', data.length);
  console.log('\n');

  // Filter out empty rows
  const rows = data.filter(row => row.some(cell => cell && cell.toString().trim()));
  
  console.log('Filtered data (removing empty rows):');
  console.log('Number of non-empty rows:', rows.length);
  console.log('\n');

  // Process each row according to our parsing logic
  console.log('Parsed data according to current implementation:');
  console.log('===============================================');
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    console.log(`Row ${i + 1} raw:`, row);
    
    // Skip if this looks like a header row
    if (i === 0 && row[0] && row[0].toString().toLowerCase().includes('prompt')) {
      console.log(`Row ${i + 1}: SKIPPED (appears to be header)`);
      continue;
    }
    
    // Skip empty rows
    if (!row || !row[0] || !row[0].toString().trim()) {
      console.log(`Row ${i + 1}: SKIPPED (empty)`);
      continue;
    }

    // Parse according to our implementation
    const promptName = row[0] ? row[0].toString().trim() : '';
    const promptText = row[1] ? row[1].toString().trim() : '';
    const model = row[2] ? row[2].toString().trim() : 'tts-1';
    const voice = row[3] ? row[3].toString().trim() : 'alloy';
    const instructions = row[4] ? row[4].toString().trim() : '';

    console.log(`Row ${i + 1} parsed:`);
    console.log(`  Prompt Name: "${promptName}"`);
    console.log(`  Prompt Text: "${promptText.substring(0, 80)}${promptText.length > 80 ? '...' : ''}"`);
    console.log(`  Model: "${model}"`);
    console.log(`  Voice: "${voice}"`);
    console.log(`  Instructions: "${instructions.substring(0, 60)}${instructions.length > 60 ? '...' : ''}"`);
    console.log(`  Filename would be: "${promptName}.mp3"`);
    console.log('');
  }

} catch (error) {
  console.error('Error reading Excel file:', error);
  console.error('Stack trace:', error.stack);
}
