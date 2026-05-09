import { BaseService } from './base.service';
import { AdvancedAnalyticsFilter } from '../types/analytics-workspace.schema';

export interface FilteredData {
  constituencies: any[];
  elections: any[];
  parties: any[];
  regions: any[];
  summary: FilterSummary;
}

export interface FilterSummary {
  totalConstituencies: number;
  filteredConstituencies: number;
  totalElections: number;
  filteredElections: number;
  totalParties: number;
  filteredParties: number;
  filterComplexity: 'low' | 'medium' | 'high';
  estimatedDataPoints: number;
}

export class AnalyticsFilterService extends BaseService {
  // Mock data - in production, this would query the database
  private mockData = {
    constituencies: [
      {
        id: 'c1',
        name: 'Mumbai North',
        state: 'Maharashtra',
        region: 'West',
        district: 'Mumbai',
        turnout: 65.5,
        margin: 2.3,
        winner: 'John Doe',
        party: 'INC',
        voteShare: 52.3,
        swing: 3.2,
        flipped: true,
        urbanRural: 'urban',
        incomeLevel: 'high',
        educationLevel: 'high',
        competitiveness: 'competitive',
        incumbency: 'challenger',
        candidateType: 'newcomer',
        year: 2024,
      },
      {
        id: 'c2',
        name: 'Delhi East',
        state: 'Delhi',
        region: 'North',
        district: 'East Delhi',
        turnout: 72.1,
        margin: 5.8,
        winner: 'Alice Johnson',
        party: 'BJP',
        voteShare: 48.7,
        swing: -1.5,
        flipped: false,
        urbanRural: 'urban',
        incomeLevel: 'medium',
        educationLevel: 'medium',
        competitiveness: 'safe',
        incumbency: 'incumbent',
        candidateType: 'veteran',
        year: 2024,
      },
      {
        id: 'c3',
        name: 'Bangalore South',
        state: 'Karnataka',
        region: 'South',
        district: 'Bangalore',
        turnout: 68.9,
        margin: 1.2,
        winner: 'Bob Williams',
        party: 'INC',
        voteShare: 51.2,
        swing: 4.5,
        flipped: true,
        urbanRural: 'urban',
        incomeLevel: 'high',
        educationLevel: 'high',
        competitiveness: 'tossup',
        incumbency: 'open_seat',
        candidateType: 'newcomer',
        year: 2024,
      },
      {
        id: 'c4',
        name: 'Chennai Central',
        state: 'Tamil Nadu',
        region: 'South',
        district: 'Chennai',
        turnout: 75.3,
        margin: 8.5,
        winner: 'Diana Prince',
        party: 'DMK',
        voteShare: 55.1,
        swing: 2.1,
        flipped: false,
        urbanRural: 'urban',
        incomeLevel: 'medium',
        educationLevel: 'high',
        competitiveness: 'safe',
        incumbency: 'incumbent',
        candidateType: 'veteran',
        year: 2024,
      },
      {
        id: 'c5',
        name: 'Kolkata North',
        state: 'West Bengal',
        region: 'East',
        district: 'Kolkata',
        turnout: 71.8,
        margin: 3.7,
        winner: 'Eve Adams',
        party: 'TMC',
        voteShare: 49.8,
        swing: 1.8,
        flipped: false,
        urbanRural: 'urban',
        incomeLevel: 'low',
        educationLevel: 'medium',
        competitiveness: 'competitive',
        incumbency: 'challenger',
        candidateType: 'returning',
        year: 2024,
      },
    ],
    elections: [
      { id: 'election-2019', year: 2019, name: '2019 General Election' },
      { id: 'election-2024', year: 2024, name: '2024 General Election' },
    ],
    parties: [
      { name: 'BJP', category: 'national' },
      { name: 'INC', category: 'national' },
      { name: 'DMK', category: 'regional' },
      { name: 'TMC', category: 'regional' },
      { name: 'BSP', category: 'national' },
    ],
    regions: ['North', 'South', 'East', 'West', 'Central'],
  };

  /**
   * Apply deep filters to data
   */
  applyFilters(filter: AdvancedAnalyticsFilter): FilteredData {
    let filteredConstituencies = [...this.mockData.constituencies];
    let filteredElections = [...this.mockData.elections];
    let filteredParties = [...this.mockData.parties];

    // Geographic filters
    if (filter.states && filter.states.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.states!.includes(c.state)
      );
    }

    if (filter.constituencies && filter.constituencies.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.constituencies!.includes(c.id)
      );
    }

    if (filter.regions && filter.regions.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.regions!.includes(c.region)
      );
    }

    if (filter.districts && filter.districts.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.districts!.includes(c.district)
      );
    }

    // Election filters
    if (filter.electionIds && filter.electionIds.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.electionIds!.includes(`election-${c.year}`)
      );
    }

    if (filter.electionYears && filter.electionYears.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.electionYears!.includes(c.year)
      );
    }

    // Party filters
    if (filter.parties && filter.parties.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.parties!.includes(c.party)
      );
      filteredParties = filteredParties.filter(p =>
        filter.parties!.includes(p.name)
      );
    }

    if (filter.partyCategories && filter.partyCategories.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c => {
        const foundParty = this.mockData.parties.find((party: any) => party.name === c.party);
        return foundParty && filter.partyCategories!.includes(foundParty.category as any);
      });
      filteredParties = filteredParties.filter((party: any) =>
        filter.partyCategories!.includes(party.category as any)
      );
    }

    if (filter.excludeParties && filter.excludeParties.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        !filter.excludeParties!.includes(c.party)
      );
      filteredParties = filteredParties.filter(p =>
        !filter.excludeParties!.includes(p.name)
      );
    }

    // Performance filters
    if (filter.turnoutRange) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        c.turnout >= filter.turnoutRange!.min && c.turnout <= filter.turnoutRange!.max
      );
    }

    if (filter.marginRange) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        c.margin >= filter.marginRange!.min && c.margin <= filter.marginRange!.max
      );
    }

    if (filter.voteShareRange) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        c.voteShare >= filter.voteShareRange!.min && c.voteShare <= filter.voteShareRange!.max
      );
    }

    if (filter.swingRange) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        c.swing >= filter.swingRange!.min && c.swing <= filter.swingRange!.max
      );
    }

    // Outcome filters
    if (filter.outcomes && filter.outcomes.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c => {
        if (filter.outcomes!.includes('won')) return c.party === c.winner;
        if (filter.outcomes!.includes('lost')) return c.party !== c.winner;
        return true;
      });
    }

    if (filter.flippedOnly) {
      filteredConstituencies = filteredConstituencies.filter(c => c.flipped);
    }

    if (filter.closeRacesOnly) {
      filteredConstituencies = filteredConstituencies.filter(c => c.margin < 5);
    }

    // Demographic filters
    if (filter.urbanRuralMix && filter.urbanRuralMix.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.urbanRuralMix!.includes(c.urbanRural as any)
      );
    }

    if (filter.incomeLevel && filter.incomeLevel.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.incomeLevel!.includes(c.incomeLevel as any)
      );
    }

    if (filter.educationLevel && filter.educationLevel.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.educationLevel!.includes(c.educationLevel as any)
      );
    }

    // Advanced filters
    if (filter.competitiveness && filter.competitiveness.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.competitiveness!.includes(c.competitiveness as any)
      );
    }

    if (filter.incumbency && filter.incumbency.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.incumbency!.includes(c.incumbency as any)
      );
    }

    if (filter.candidateType && filter.candidateType.length > 0) {
      filteredConstituencies = filteredConstituencies.filter(c =>
        filter.candidateType!.includes(c.candidateType as any)
      );
    }

    // Filter regions based on filtered constituencies
    const filteredRegions = [
      ...new Set(filteredConstituencies.map(c => c.region)),
    ];

    const summary = this.generateSummary(
      filteredConstituencies,
      filteredElections,
      filteredParties,
      filter
    );

    return {
      constituencies: filteredConstituencies,
      elections: filteredElections,
      parties: filteredParties,
      regions: filteredRegions,
      summary,
    };
  }

  /**
   * Generate filter summary
   */
  private generateSummary(
    constituencies: any[],
    elections: any[],
    parties: any[],
    filter: AdvancedAnalyticsFilter
  ): FilterSummary {
    const filterCount = this.countActiveFilters(filter);
    const filterComplexity: 'low' | 'medium' | 'high' =
      filterCount < 3 ? 'low' : filterCount < 7 ? 'medium' : 'high';

    return {
      totalConstituencies: this.mockData.constituencies.length,
      filteredConstituencies: constituencies.length,
      totalElections: this.mockData.elections.length,
      filteredElections: elections.length,
      totalParties: this.mockData.parties.length,
      filteredParties: parties.length,
      filterComplexity,
      estimatedDataPoints: constituencies.length * 10, // Estimate data points per constituency
    };
  }

  /**
   * Count active filters
   */
  private countActiveFilters(filter: AdvancedAnalyticsFilter): number {
    let count = 0;

    if (filter.states?.length) count++;
    if (filter.constituencies?.length) count++;
    if (filter.regions?.length) count++;
    if (filter.districts?.length) count++;
    if (filter.electionIds?.length) count++;
    if (filter.electionYears?.length) count++;
    if (filter.parties?.length) count++;
    if (filter.partyCategories?.length) count++;
    if (filter.excludeParties?.length) count++;
    if (filter.turnoutRange) count++;
    if (filter.marginRange) count++;
    if (filter.voteShareRange) count++;
    if (filter.swingRange) count++;
    if (filter.outcomes?.length) count++;
    if (filter.flippedOnly) count++;
    if (filter.closeRacesOnly) count++;
    if (filter.urbanRuralMix?.length) count++;
    if (filter.incomeLevel?.length) count++;
    if (filter.educationLevel?.length) count++;
    if (filter.competitiveness?.length) count++;
    if (filter.incumbency?.length) count++;
    if (filter.candidateType?.length) count++;

    return count;
  }

  /**
   * Get filter suggestions based on data
   */
  getFilterSuggestions(): {
    states: string[];
    parties: string[];
    regions: string[];
    districts: string[];
  } {
    return {
      states: [...new Set(this.mockData.constituencies.map(c => c.state))],
      parties: this.mockData.parties.map(p => p.name),
      regions: [...new Set(this.mockData.constituencies.map(c => c.region))],
      districts: [...new Set(this.mockData.constituencies.map(c => c.district))],
    };
  }

  /**
   * Validate filter configuration
   */
  validateFilter(filter: AdvancedAnalyticsFilter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filter.turnoutRange && filter.turnoutRange.min < 0) {
      errors.push('Turnout minimum cannot be negative');
    }
    if (filter.turnoutRange && filter.turnoutRange.min > filter.turnoutRange.max) {
      errors.push('Turnout minimum cannot be greater than maximum');
    }
    if (filter.marginRange && filter.marginRange.min < 0) {
      errors.push('Margin minimum cannot be negative');
    }
    if (filter.marginRange && filter.marginRange.min > filter.marginRange.max) {
      errors.push('Margin minimum cannot be greater than maximum');
    }
    if (filter.voteShareRange && filter.voteShareRange.min < 0) {
      errors.push('Vote share minimum cannot be negative');
    }
    if (filter.voteShareRange && filter.voteShareRange.min > filter.voteShareRange.max) {
      errors.push('Vote share minimum cannot be greater than maximum');
    }
    if (filter.voteShareRange && filter.voteShareRange.max > 100) {
      errors.push('Vote share maximum cannot exceed 100%');
    }
    if (filter.swingRange && filter.swingRange.min < -100) {
      errors.push('Swing minimum cannot be less than -100%');
    }
    if (filter.swingRange && filter.swingRange.max > 100) {
      errors.push('Swing maximum cannot exceed 100%');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert filter to query string
   */
  filterToQueryString(filter: AdvancedAnalyticsFilter): string {
    const params: string[] = [];

    if (filter.states?.length) params.push(`states=${filter.states.join(',')}`);
    if (filter.parties?.length) params.push(`parties=${filter.parties.join(',')}`);
    if (filter.electionYears?.length) params.push(`years=${filter.electionYears.join(',')}`);
    if (filter.turnoutRange) {
      params.push(`turnout_min=${filter.turnoutRange.min}&turnout_max=${filter.turnoutRange.max}`);
    }
    if (filter.marginRange) {
      params.push(`margin_min=${filter.marginRange.min}&margin_max=${filter.marginRange.max}`);
    }
    if (filter.flippedOnly) params.push('flipped_only=true');
    if (filter.closeRacesOnly) params.push('close_races_only=true');

    return params.join('&');
  }

  /**
   * Parse query string to filter
   */
  queryStringToFilter(queryString: string): AdvancedAnalyticsFilter {
    const filter: AdvancedAnalyticsFilter = {};
    const params = new URLSearchParams(queryString);

    if (params.has('states')) {
      filter.states = params.get('states')!.split(',');
    }
    if (params.has('parties')) {
      filter.parties = params.get('parties')!.split(',');
    }
    if (params.has('years')) {
      filter.electionYears = params.get('years')!.split(',').map(Number);
    }
    if (params.has('turnout_min') && params.has('turnout_max')) {
      filter.turnoutRange = {
        min: Number(params.get('turnout_min')),
        max: Number(params.get('turnout_max')),
      };
    }
    if (params.has('margin_min') && params.has('margin_max')) {
      filter.marginRange = {
        min: Number(params.get('margin_min')),
        max: Number(params.get('margin_max')),
      };
    }
    if (params.has('flipped_only')) {
      filter.flippedOnly = params.get('flipped_only') === 'true';
    }
    if (params.has('close_races_only')) {
      filter.closeRacesOnly = params.get('close_races_only') === 'true';
    }

    return filter;
  }
}

// Singleton instance
let analyticsFilterService: AnalyticsFilterService | null = null;

export function getAnalyticsFilterService(): AnalyticsFilterService {
  if (!analyticsFilterService) {
    analyticsFilterService = new AnalyticsFilterService();
  }
  return analyticsFilterService;
}
