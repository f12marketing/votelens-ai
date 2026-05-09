import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { Readable } from 'stream';
import { BaseService } from './base.service';

export interface ParsedRow {
  [key: string]: any;
}

export interface ParseResult {
  success: boolean;
  data: ParsedRow[];
  headers: string[];
  rowCount: number;
  errors: string[];
}

export class ParserService extends BaseService {
  private readonly REQUIRED_COLUMNS = [
    'constituency',
    'candidate',
    'party',
    'votes',
    'turnout'
  ];

  private readonly OPTIONAL_COLUMNS = [
    'state',
    'district',
    'region',
    'position',
    'previous_votes',
    'previous_turnout'
  ];

  /**
   * Parse CSV file
   */
  async parseCSV(file: Buffer): Promise<ParseResult> {
    this.logInfo('Parsing CSV file');
    const data: ParsedRow[] = [];
    const errors: string[] = [];
    let headers: string[] = [];

    return new Promise((resolve) => {
      const stream = Readable.from(file);

      stream
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList.map(h => h.trim().toLowerCase());
          this.validateHeaders(headers, errors);
        })
        .on('data', (row) => {
          const normalizedRow = this.normalizeRow(row);
          data.push(normalizedRow);
        })
        .on('error', (error) => {
          this.logError('CSV parsing error', { error: error.message });
          errors.push(`CSV parsing error: ${error.message}`);
          resolve({ success: false, data, headers, rowCount: data.length, errors });
        })
        .on('end', () => {
          this.logInfo('CSV parsing completed', { rowCount: data.length });
          resolve({ success: errors.length === 0, data, headers, rowCount: data.length, errors });
        });
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(file: Buffer): Promise<ParseResult> {
    this.logInfo('Parsing Excel file');
    const errors: string[] = [];
    const data: ParsedRow[] = [];

    try {
      const workbook = xlsx.read(file, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
      
      if (jsonData.length === 0) {
        errors.push('Excel file is empty');
        return { success: false, data, headers: [], rowCount: 0, errors };
      }

      const headers = Object.keys(jsonData[0]).map(h => h.trim().toLowerCase());
      this.validateHeaders(headers, errors);

      jsonData.forEach((row: any) => {
        const normalizedRow = this.normalizeRow(row);
        data.push(normalizedRow);
      });

      this.logInfo('Excel parsing completed', { rowCount: data.length });
      return { success: errors.length === 0, data, headers, rowCount: data.length, errors };
    } catch (error: any) {
      this.logError('Excel parsing error', { error: error.message });
      errors.push(`Excel parsing error: ${error.message}`);
      return { success: false, data, headers: [], rowCount: 0, errors };
    }
  }

  /**
   * Parse JSON file
   */
  async parseJSON(file: Buffer): Promise<ParseResult> {
    this.logInfo('Parsing JSON file');
    const errors: string[] = [];
    const data: ParsedRow[] = [];

    try {
      const jsonString = file.toString('utf-8');
      const jsonData = JSON.parse(jsonString);

      if (!Array.isArray(jsonData)) {
        errors.push('JSON must be an array of objects');
        return { success: false, data, headers: [], rowCount: 0, errors };
      }

      if (jsonData.length === 0) {
        errors.push('JSON array is empty');
        return { success: false, data, headers: [], rowCount: 0, errors };
      }

      const headers = Object.keys(jsonData[0]).map(h => h.trim().toLowerCase());
      this.validateHeaders(headers, errors);

      jsonData.forEach((row: any) => {
        const normalizedRow = this.normalizeRow(row);
        data.push(normalizedRow);
      });

      this.logInfo('JSON parsing completed', { rowCount: data.length });
      return { success: errors.length === 0, data, headers, rowCount: data.length, errors };
    } catch (error: any) {
      this.logError('JSON parsing error', { error: error.message });
      errors.push(`JSON parsing error: ${error.message}`);
      return { success: false, data, headers: [], rowCount: 0, errors };
    }
  }

  /**
   * Validate headers
   */
  private validateHeaders(headers: string[], errors: string[]): void {
    const missingColumns = this.REQUIRED_COLUMNS.filter(
      col => !headers.includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  /**
   * Normalize row data
   */
  private normalizeRow(row: any): ParsedRow {
    const normalized: ParsedRow = {};
    
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim().toLowerCase();
      let value = row[key];

      // Trim string values
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Convert numeric strings to numbers
      if (typeof value === 'string' && !isNaN(Number(value))) {
        value = Number(value);
      }

      normalized[normalizedKey] = value;
    });

    return normalized;
  }

  /**
   * Detect file type
   */
  detectFileType(filename: string): 'csv' | 'excel' | 'json' | 'unknown' {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'json':
        return 'json';
      default:
        return 'unknown';
    }
  }

  /**
   * Parse file based on type
   */
  async parseFile(file: Buffer, filename: string): Promise<ParseResult> {
    const fileType = this.detectFileType(filename);

    switch (fileType) {
      case 'csv':
        return this.parseCSV(file);
      case 'excel':
        return this.parseExcel(file);
      case 'json':
        return this.parseJSON(file);
      default:
        return {
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          errors: ['Unsupported file type. Please upload CSV, Excel, or JSON.']
        };
    }
  }
}

export const parserService = new ParserService();
