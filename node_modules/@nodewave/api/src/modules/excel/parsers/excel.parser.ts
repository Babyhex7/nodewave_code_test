import * as XLSX from 'xlsx';
import fs from 'fs';

export class ExcelParser {
  // Parsing file Excel menjadi JSON
  parse(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found at ' + filePath);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(worksheet);
  }
}
