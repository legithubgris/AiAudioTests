// Test script to upload Excel file to our running server
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testExcelUpload() {
  try {
    console.log('Testing Excel upload to running server...');
    
    // Create form data
    const form = new FormData();
    const filePath = path.join(__dirname, 'neuralScripts', 'miniTest.xlsx');
    const fileStream = fs.createReadStream(filePath);
    
    form.append('excelFile', fileStream, 'miniTest.xlsx');
    
    // Upload to server
    const response = await axios.post('http://localhost:5001/api/tts/process-excel', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 60000 // 60 second timeout
    });
    
    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check the generated files
    const playlist = response.data.playlist;
    console.log('\nGenerated files:');
    playlist.files.forEach((file, index) => {
      console.log(`File ${index + 1}:`);
      console.log(`  Filename: ${file.filename}`);
      console.log(`  Prompt Name: ${file.promptName}`);
      console.log(`  Prompt Text: ${file.promptText.substring(0, 60)}...`);
      console.log(`  Model: ${file.model}`);
      console.log(`  Voice: ${file.voice}`);
      console.log(`  Status: ${file.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error uploading Excel file:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testExcelUpload();
