import { BaseService } from './base.service';
import { ParsedRow } from './parser.service';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRows: ParsedRow[];
  invalidRowCount: number;
  duplicateCount: number;
}

export class ValidationService extends BaseService {
  /**
   * Validate parsed election data
   */
  async validateDataset(data: ParsedRow[]): Promise<ValidationResult> {
    this.logInfo('Validating dataset', { rowCount: data.length });

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const validRows: ParsedRow[] = [];
    const seenRows = new Set<string>();
    let duplicateCount = 0;

    // Check for empty dataset
    if (data.length === 0) {
      errors.push({
        row: 0,
        field: 'dataset',
        message: 'Dataset is empty',
        severity: 'error'
      });
      return {
        valid: false,
        errors,
        warnings,
        validRows,
        invalidRowCount: 0,
        duplicateCount: 0
      };
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors = this.validateRow(row, rowNumber);
      const rowWarnings = this.validateRowWarnings(row, rowNumber);

      errors.push(...rowErrors);
      warnings.push(...rowWarnings);

      // Check for duplicates
      const rowKey = this.getRowKey(row);
      if (seenRows.has(rowKey)) {
        duplicateCount++;
        errors.push({
          row: rowNumber,
          field: 'duplicate',
          message: 'Duplicate constituency/candidate combination',
          severity: 'error'
        });
      } else {
        seenRows.add(rowKey);
      }

      // Add to valid rows if no errors
      if (rowErrors.length === 0) {
        validRows.push(row);
      }
    });

    const invalidRowCount = data.length - validRows.length;
    const isValid = errors.length === 0;

    this.logInfo('Validation completed', {
      valid: isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      validRowCount: validRows.length,
      invalidRowCount,
      duplicateCount
    });

    return {
      valid: isValid,
      errors,
      warnings,
      validRows,
      invalidRowCount,
      duplicateCount
    };
  }

  /**
   * Validate a single row
   */
  private validateRow(row: ParsedRow, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate constituency
    if (!row.constituency || typeof row.constituency !== 'string' || row.constituency.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'constituency',
        message: 'Constituency is required and must be a non-empty string',
        severity: 'error'
      });
    }

    // Validate candidate
    if (!row.candidate || typeof row.candidate !== 'string' || row.candidate.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'candidate',
        message: 'Candidate is required and must be a non-empty string',
        severity: 'error'
      });
    }

    // Validate party
    if (!row.party || typeof row.party !== 'string' || row.party.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'party',
        message: 'Party is required and must be a non-empty string',
        severity: 'error'
      });
    }

    // Validate votes
    if (row.votes === undefined || row.votes === null || row.votes === '') {
      errors.push({
        row: rowNumber,
        field: 'votes',
        message: 'Votes are required',
        severity: 'error'
      });
    } else {
      const votes = Number(row.votes);
      if (isNaN(votes) || votes < 0) {
        errors.push({
          row: rowNumber,
          field: 'votes',
          message: 'Votes must be a non-negative number',
          severity: 'error'
        });
      } else if (!Number.isInteger(votes)) {
        errors.push({
          row: rowNumber,
          field: 'votes',
          message: 'Votes must be a whole number',
          severity: 'error'
        });
      }
    }

    // Validate turnout
    if (row.turnout !== undefined && row.turnout !== null && row.turnout !== '') {
      const turnout = Number(row.turnout);
      if (isNaN(turnout) || turnout < 0 || turnout > 100) {
        errors.push({
          row: rowNumber,
          field: 'turnout',
          message: 'Turnout must be a percentage between 0 and 100',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * Validate row warnings (non-blocking issues)
   */
  private validateRowWarnings(row: ParsedRow, rowNumber: number): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Warn if state is missing
    if (!row.state) {
      warnings.push({
        row: rowNumber,
        field: 'state',
        message: 'State is recommended for better geographic analysis',
        severity: 'warning'
      });
    }

    // Warn if district is missing
    if (!row.district) {
      warnings.push({
        row: rowNumber,
        field: 'district',
        message: 'District is recommended for better geographic analysis',
        severity: 'warning'
      });
    }

    // Warn if turnout is missing
    if (row.turnout === undefined || row.turnout === null || row.turnout === '') {
      warnings.push({
        row: rowNumber,
        field: 'turnout',
        message: 'Turnout is recommended for complete analysis',
        severity: 'warning'
      });
    }

    // Warn if votes are suspiciously high (more than voter count)
    if (row.votes && row.voter_count && Number(row.votes) > Number(row.voter_count)) {
      warnings.push({
        row: rowNumber,
        field: 'votes',
        message: 'Votes exceed voter count - please verify data',
        severity: 'warning'
      });
    }

    return warnings;
  }

  /**
   * Generate a unique key for duplicate detection
   */
  private getRowKey(row: ParsedRow): string {
    const constituency = (row.constituency || '').toString().toLowerCase().trim();
    const candidate = (row.candidate || '').toString().toLowerCase().trim();
    return `${constituency}|${candidate}`;
  }

  /**
   * Validate file size
   */
  validateFileSize(fileSize: number, maxSizeMB: number = 10): { valid: boolean; message?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (fileSize > maxSizeBytes) {
      return {
        valid: false,
        message: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Validate file type
   */
  validateFileType(filename: string, allowedTypes: string[] = ['csv', 'xlsx', 'xls', 'json']): { valid: boolean; message?: string } {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedTypes.includes(extension)) {
      return {
        valid: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }
}

export const validationService = new ValidationService();
