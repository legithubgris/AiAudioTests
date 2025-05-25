// src/utils.js
import * as XLSX from 'xlsx';

/**
 * Parse an Excel file and return its contents as a JavaScript object
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} - Promise resolving to array of rows
 */
export const parseXlsx = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Check file type
    const isExcel = 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls');
      
    if (!isExcel) {
      reject(new Error(`File "${file.name}" is not a valid Excel file`));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('Excel file contains no sheets'));
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
          reject(new Error('Could not access worksheet in Excel file'));
          return;
        }
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!jsonData || jsonData.length < 2) {
          reject(new Error('Excel file appears to be empty or has no data rows'));
          return;
        }
        
        const headers = jsonData[0]; // First row as headers
        const rows = jsonData.slice(1).map(row => {
          const rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index];
          });
          return rowObject;
        });
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = (e) => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};