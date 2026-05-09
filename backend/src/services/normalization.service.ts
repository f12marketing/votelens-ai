import { BaseService } from './base.service';

export interface NormalizedRow {
  constituency: string;
  constituency_normalized: string;
  state?: string;
  state_normalized?: string;
  district?: string;
  district_normalized?: string;
  candidate: string;
  candidate_normalized: string;
  party: string;
  party_normalized: string;
  votes: number;
  turnout?: number;
  voter_count?: number;
  vote_share?: number;
  margin?: number;
  swing?: number;
  position?: string;
}

export interface NormalizationResult {
  success: boolean;
  data: NormalizedRow[];
  metadata: {
    totalRows: number;
    normalizedRows: number;
    duplicateRowsRemoved: number;
    missingValuesHandled: number;
    warnings: string[];
  };
}

export class NormalizationService extends BaseService {
  private constituencyMappings = new Map<string, string>();
  private partyMappings = new Map<string, string>();
  private stateMappings = new Map<string, string>();

  /**
   * Normalize constituency names
   * - Convert to title case
   * - Remove special characters
   * - Standardize common variations
   */
  normalizeConstituency(name: string): string {
    if (!name) return '';

    // Convert to title case
    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Remove special characters except hyphens and apostrophes
    normalized = normalized.replace(/[^a-zA-Z0-9\s\-']/g, '');

    // Apply known mappings
    if (this.constituencyMappings.has(normalized)) {
      normalized = this.constituencyMappings.get(normalized)!;
    }

    // Standardize common variations
    const variations: Record<string, string> = {
      'constituency': '',
      'district': '',
      'north': 'North',
      'south': 'South',
      'east': 'East',
      'west': 'West',
      'central': 'Central',
      'new': 'New',
      'old': 'Old',
      'greater': 'Greater',
      'metropolitan': 'Metro',
    };

    Object.keys(variations).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      normalized = normalized.replace(regex, variations[key]);
    });

    return normalized.trim();
  }

  /**
   * Normalize party names
   * - Convert to title case
   * - Remove common prefixes/suffixes
   * - Standardize abbreviations
   */
  normalizeParty(name: string): string {
    if (!name) return '';

    // Convert to title case
    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Remove common prefixes
    const prefixes = ['The', 'Party Of', 'Party', 'Political'];
    prefixes.forEach(prefix => {
      const regex = new RegExp(`^${prefix}\\s+`, 'i');
      normalized = normalized.replace(regex, '');
    });

    // Standardize abbreviations
    const abbreviations: Record<string, string> = {
      'Ltd': 'Ltd.',
      'Corp': 'Corp.',
      'Co': 'Co.',
      '&': 'and',
      'Bjp': 'BJP',
      'Inc': 'INC',
      'Cpi': 'CPI',
      'Cpm': 'CPM',
      'Rjd': 'RJD',
      'Tmc': 'TMC',
      'Aap': 'AAP',
      'Bsp': 'BSP',
      'Ssp': 'SSP',
      'Jkpdp': 'JKPDP',
      'Ncp': 'NCP',
      'Dmk': 'DMK',
      'Aidmk': 'AIADMK',
    };

    Object.keys(abbreviations).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, abbreviations[abbr]);
    });

    // Apply known mappings
    if (this.partyMappings.has(normalized)) {
      normalized = this.partyMappings.get(normalized)!;
    }

    return normalized.trim();
  }

  /**
   * Normalize state names
   */
  normalizeState(name: string): string {
    if (!name) return '';

    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Standardize state names
    const stateMappings: Record<string, string> = {
      'Uttar Pradesh': 'Uttar Pradesh',
      'U.P.': 'Uttar Pradesh',
      'Maharashtra': 'Maharashtra',
      'Maha': 'Maharashtra',
      'Tamil Nadu': 'Tamil Nadu',
      'T.N.': 'Tamil Nadu',
      'Karnataka': 'Karnataka',
      'Kar': 'Karnataka',
      'West Bengal': 'West Bengal',
      'W.B.': 'West Bengal',
      'Delhi': 'Delhi',
      'Nct Of Delhi': 'Delhi',
      'Gujarat': 'Gujarat',
      'Rajasthan': 'Rajasthan',
      'Kerala': 'Kerala',
      'Punjab': 'Punjab',
      'Haryana': 'Haryana',
      'Madhya Pradesh': 'Madhya Pradesh',
      'M.P.': 'Madhya Pradesh',
    };

    if (stateMappings[normalized]) {
      normalized = stateMappings[normalized];
    }

    if (this.stateMappings.has(normalized)) {
      normalized = this.stateMappings.get(normalized)!;
    }

    return normalized.trim();
  }

  /**
   * Normalize candidate names
   */
  normalizeCandidate(name: string): string {
    if (!name) return '';

    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Remove common titles
    const titles = ['Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Shri', 'Smt.', 'Smt', 'Prof.', 'Prof'];
    titles.forEach(title => {
      const regex = new RegExp(`^${title}\\s+`, 'i');
      normalized = normalized.replace(regex, '');
    });

    return normalized.trim();
  }

  /**
   * Remove duplicate rows based on constituency + candidate combination
   */
  removeDuplicates(rows: NormalizedRow[]): NormalizedRow[] {
    const seen = new Set<string>();
    const unique: NormalizedRow[] = [];
    let duplicatesRemoved = 0;

    rows.forEach(row => {
      const key = `${row.constituency_normalized}|${row.candidate_normalized}`;
      if (seen.has(key)) {
        duplicatesRemoved++;
      } else {
        seen.add(key);
        unique.push(row);
      }
    });

    this.logInfo('Duplicates removed', { duplicatesRemoved });
    return unique;
  }

  /**
   * Handle missing values with various strategies
   */
  handleMissingValues(row: any, strategy: 'remove' | 'fill' | 'estimate' = 'fill'): any | null {
    const requiredFields = ['constituency', 'candidate', 'party', 'votes'];
    const optionalFields = ['turnout', 'state', 'district', 'voter_count'];

    // Check required fields
    for (const field of requiredFields) {
      if (!row[field] || row[field] === '' || row[field] === null || row[field] === undefined) {
        if (strategy === 'remove') {
          return null;
        }
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Handle optional fields based on strategy
    const result = { ...row };

    for (const field of optionalFields) {
      if (!result[field] || result[field] === '' || result[field] === null || result[field] === undefined) {
        if (strategy === 'fill') {
          // Fill with default values
          if (field === 'turnout') result[field] = 0;
          if (field === 'voter_count') result[field] = 0;
          if (field === 'state' || field === 'district') result[field] = 'Unknown';
        }
        // If 'estimate', we'll handle this in the calculation phase
      }
    }

    return result;
  }

  /**
   * Calculate vote share percentage
   */
  calculateVoteShare(votes: number, totalVotes: number): number {
    if (totalVotes === 0) return 0;
    return Number(((votes / totalVotes) * 100).toFixed(2));
  }

  /**
   * Calculate margin (difference between top two candidates)
   */
  calculateMargin(candidateVotes: number, runnerUpVotes: number): number {
    return Number((candidateVotes - runnerUpVotes).toFixed(0));
  }

  /**
   * Calculate swing (change from previous election)
   */
  calculateSwing(currentVoteShare: number, previousVoteShare: number): number {
    return Number((currentVoteShare - previousVoteShare).toFixed(2));
  }

  /**
   * Calculate turnout percentage
   */
  calculateTurnout(totalVotes: number, voterCount: number): number {
    if (voterCount === 0) return 0;
    return Number(((totalVotes / voterCount) * 100).toFixed(2));
  }

  /**
   * Main normalization pipeline
   */
  async normalizeDataset(rawData: any[], options: {
    removeDuplicates?: boolean;
    handleMissingValues?: 'remove' | 'fill' | 'estimate';
    calculateMetrics?: boolean;
  } = {}): Promise<NormalizationResult> {
    this.logInfo('Starting normalization pipeline', { rowCount: rawData.length });

    const {
      removeDuplicates = true,
      handleMissingValues: missingValueStrategy = 'fill',
      calculateMetrics = true,
    } = options;

    const warnings: string[] = [];
    let missingValuesHandled = 0;
    const normalizedData: NormalizedRow[] = [];

    // Step 1: Handle missing values and normalize basic fields
    for (const row of rawData) {
      try {
        const processed = this.handleMissingValues(row, missingValueStrategy);
        if (!processed) {
          missingValuesHandled++;
          continue;
        }

        const normalized: NormalizedRow = {
          constituency: processed.constituency || '',
          constituency_normalized: this.normalizeConstituency(processed.constituency),
          state: processed.state,
          state_normalized: processed.state ? this.normalizeState(processed.state) : undefined,
          district: processed.district,
          district_normalized: processed.district ? this.normalizeDistrict(processed.district) : undefined,
          candidate: processed.candidate || '',
          candidate_normalized: this.normalizeCandidate(processed.candidate),
          party: processed.party || '',
          party_normalized: this.normalizeParty(processed.party),
          votes: Number(processed.votes) || 0,
          turnout: processed.turnout ? Number(processed.turnout) : undefined,
          voter_count: processed.voter_count ? Number(processed.voter_count) : undefined,
          position: processed.position,
        };

        normalizedData.push(normalized);
      } catch (error: any) {
        warnings.push(`Row normalization error: ${error.message}`);
      }
    }

    // Step 2: Remove duplicates
    let uniqueData = normalizedData;
    let duplicatesRemoved = 0;
    if (removeDuplicates) {
      uniqueData = this.removeDuplicates(normalizedData);
      duplicatesRemoved = normalizedData.length - uniqueData.length;
    }

    // Step 3: Calculate metrics if enabled
    if (calculateMetrics) {
      uniqueData = this.calculateMetricsForDataset(uniqueData);
    }

    this.logInfo('Normalization completed', {
      totalRows: rawData.length,
      normalizedRows: uniqueData.length,
      duplicateRowsRemoved: duplicatesRemoved,
      missingValuesHandled,
      warningCount: warnings.length,
    });

    return {
      success: warnings.length === 0,
      data: uniqueData,
      metadata: {
        totalRows: rawData.length,
        normalizedRows: uniqueData.length,
        duplicateRowsRemoved: duplicatesRemoved,
        missingValuesHandled,
        warnings,
      },
    };
  }

  /**
   * Calculate metrics (vote share, margin, swing, turnout) for dataset
   */
  private calculateMetricsForDataset(data: NormalizedRow[]): NormalizedRow[] {
    // Group by constituency
    const constituencyGroups = new Map<string, NormalizedRow[]>();

    data.forEach(row => {
      const key = row.constituency_normalized;
      if (!constituencyGroups.has(key)) {
        constituencyGroups.set(key, []);
      }
      constituencyGroups.get(key)!.push(row);
    });

    // Calculate metrics for each constituency
    constituencyGroups.forEach((rows) => {
      // Calculate total votes in constituency
      const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);

      // Sort by votes (descending)
      rows.sort((a, b) => b.votes - a.votes);

      // Calculate vote share and margin for each candidate
      rows.forEach((row, index) => {
        row.vote_share = this.calculateVoteShare(row.votes, totalVotes);

        // Margin: difference between winner and runner-up
        if (index === 0 && rows.length > 1) {
          row.margin = this.calculateMargin(row.votes, rows[1].votes);
        } else if (index === 1) {
          row.margin = this.calculateMargin(rows[0].votes, row.votes);
        } else {
          row.margin = 0;
        }
      });

      // Calculate turnout if voter_count is available
      if (rows[0].voter_count && rows[0].voter_count > 0) {
        rows.forEach(row => {
          if (!row.turnout || row.turnout === 0) {
            row.turnout = this.calculateTurnout(totalVotes, rows[0].voter_count || 0);
          }
        });
      }
    });

    return data;
  }

  /**
   * Normalize district names
   */
  private normalizeDistrict(name: string): string {
    if (!name) return '';

    let normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Remove 'District' suffix
    normalized = normalized.replace(/\s+District$/i, '');

    return normalized.trim();
  }

  /**
   * Add custom constituency mapping
   */
  addConstituencyMapping(original: string, normalized: string): void {
    this.constituencyMappings.set(original.toLowerCase().trim(), normalized);
  }

  /**
   * Add custom party mapping
   */
  addPartyMapping(original: string, normalized: string): void {
    this.partyMappings.set(original.toLowerCase().trim(), normalized);
  }

  /**
   * Add custom state mapping
   */
  addStateMapping(original: string, normalized: string): void {
    this.stateMappings.set(original.toLowerCase().trim(), normalized);
  }

  /**
   * Validate normalized data
   */
  validateNormalizedData(data: NormalizedRow[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    data.forEach((row, index) => {
      // Check required fields
      if (!row.constituency_normalized) {
        errors.push(`Row ${index + 1}: Missing normalized constituency`);
      }
      if (!row.candidate_normalized) {
        errors.push(`Row ${index + 1}: Missing normalized candidate`);
      }
      if (!row.party_normalized) {
        errors.push(`Row ${index + 1}: Missing normalized party`);
      }
      if (row.votes < 0) {
        errors.push(`Row ${index + 1}: Invalid votes (negative)`);
      }
      if (row.turnout !== undefined && (row.turnout < 0 || row.turnout > 100)) {
        errors.push(`Row ${index + 1}: Invalid turnout (must be 0-100)`);
      }
      if (row.vote_share !== undefined && (row.vote_share < 0 || row.vote_share > 100)) {
        errors.push(`Row ${index + 1}: Invalid vote share (must be 0-100)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const normalizationService = new NormalizationService();
