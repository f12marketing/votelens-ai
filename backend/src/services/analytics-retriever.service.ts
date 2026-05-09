import { BaseService } from './base.service';
import { ParsedQuery } from './query-parser.service';

export interface AnalyticsData {
  constituencies?: ConstituencyData[];
  candidates?: CandidateData[];
  regions?: RegionData[];
  statistics?: ElectionStatistics;
}

export interface ConstituencyData {
  id: string;
  name: string;
  state: string;
  turnout: number;
  margin: number;
  winner: string;
  party: string;
  votes: number;
  swing?: number;
  flipped?: boolean;
  previousWinner?: string;
}

export interface CandidateData {
  name: string;
  party: string;
  votes: number;
  voteShare: number;
  seatsWon: number;
  momentum?: number;
}

export interface RegionData {
  name: string;
  turnout: number;
  totalVotes: number;
  winningParty: string;
  margin: number;
  constituencies: number;
}

export interface ElectionStatistics {
  totalConstituencies: number;
  totalVotes: number;
  overallTurnout: number;
  averageMargin: number;
  closeRaces: number;
  flippedConstituencies: number;
}

export class AnalyticsRetrieverService extends BaseService {
  // Mock data - in production, this would query the database
  private mockConstituencies: ConstituencyData[] = [
    {
      id: 'c1',
      name: 'Mumbai North',
      state: 'Maharashtra',
      turnout: 65.5,
      margin: 2.3,
      winner: 'John Doe',
      party: 'INC',
      votes: 450000,
      swing: 3.2,
      flipped: true,
      previousWinner: 'Jane Smith',
    },
    {
      id: 'c2',
      name: 'Delhi East',
      state: 'Delhi',
      turnout: 72.1,
      margin: 5.8,
      winner: 'Alice Johnson',
      party: 'BJP',
      votes: 380000,
      swing: -1.5,
    },
    {
      id: 'c3',
      name: 'Bangalore South',
      state: 'Karnataka',
      turnout: 68.9,
      margin: 1.2,
      winner: 'Bob Williams',
      party: 'INC',
      votes: 420000,
      swing: 4.5,
      flipped: true,
      previousWinner: 'Charlie Brown',
    },
    {
      id: 'c4',
      name: 'Chennai Central',
      state: 'Tamil Nadu',
      turnout: 75.3,
      margin: 8.5,
      winner: 'Diana Prince',
      party: 'DMK',
      votes: 390000,
      swing: 2.1,
    },
    {
      id: 'c5',
      name: 'Kolkata North',
      state: 'West Bengal',
      turnout: 71.8,
      margin: 3.7,
      winner: 'Eve Adams',
      party: 'TMC',
      votes: 360000,
      swing: 1.8,
    },
  ];

  private mockCandidates: CandidateData[] = [
    {
      name: 'John Doe',
      party: 'INC',
      votes: 450000,
      voteShare: 52.3,
      seatsWon: 15,
      momentum: 8.5,
    },
    {
      name: 'Alice Johnson',
      party: 'BJP',
      votes: 380000,
      voteShare: 48.7,
      seatsWon: 12,
      momentum: -2.3,
    },
    {
      name: 'Bob Williams',
      party: 'INC',
      votes: 420000,
      voteShare: 51.2,
      seatsWon: 10,
      momentum: 6.7,
    },
    {
      name: 'Diana Prince',
      party: 'DMK',
      votes: 390000,
      voteShare: 55.1,
      seatsWon: 8,
      momentum: 4.2,
    },
    {
      name: 'Eve Adams',
      party: 'TMC',
      votes: 360000,
      voteShare: 49.8,
      seatsWon: 7,
      momentum: 3.1,
    },
  ];

  private mockRegions: RegionData[] = [
    {
      name: 'Maharashtra',
      turnout: 68.5,
      totalVotes: 12500000,
      winningParty: 'BJP',
      margin: 4.2,
      constituencies: 48,
    },
    {
      name: 'Delhi',
      turnout: 72.1,
      totalVotes: 8900000,
      winningParty: 'BJP',
      margin: 6.5,
      constituencies: 7,
    },
    {
      name: 'Karnataka',
      turnout: 69.3,
      totalVotes: 11200000,
      winningParty: 'INC',
      margin: 2.1,
      constituencies: 28,
    },
    {
      name: 'Tamil Nadu',
      turnout: 75.3,
      totalVotes: 9800000,
      winningParty: 'DMK',
      margin: 8.2,
      constituencies: 39,
    },
    {
      name: 'West Bengal',
      turnout: 71.8,
      totalVotes: 8700000,
      winningParty: 'TMC',
      margin: 5.7,
      constituencies: 42,
    },
  ];

  private mockStatistics: ElectionStatistics = {
    totalConstituencies: 543,
    totalVotes: 890000000,
    overallTurnout: 68.7,
    averageMargin: 5.2,
    closeRaces: 47,
    flippedConstituencies: 23,
  };

  /**
   * Retrieve analytics data based on parsed query
   */
  async retrieve(parsedQuery: ParsedQuery): Promise<AnalyticsData> {
    const data: AnalyticsData = {};

    try {
      // Retrieve based on intent
      switch (parsedQuery.intent) {
        case 'find_constituencies':
          data.constituencies = this.getConstituencies(parsedQuery);
          break;
        case 'find_candidates':
          data.candidates = this.getCandidates(parsedQuery);
          break;
        case 'compare_regions':
          data.regions = this.getRegions(parsedQuery);
          break;
        case 'find_closest_races':
          data.constituencies = this.getClosestRaces(parsedQuery);
          break;
        case 'find_highest_turnout':
          data.constituencies = this.getHighestTurnout(parsedQuery);
          break;
        case 'find_flipped_parties':
          data.constituencies = this.getFlippedConstituencies(parsedQuery);
          break;
        case 'analyze_momentum':
          data.candidates = this.getCandidatesByMomentum(parsedQuery);
          break;
        case 'get_statistics':
          data.statistics = this.getStatistics(parsedQuery);
          break;
        default:
          // Return all data for general queries
          data.constituencies = this.mockConstituencies;
          data.candidates = this.mockCandidates;
          data.regions = this.mockRegions;
          data.statistics = this.mockStatistics;
      }

      // Apply filters
      if (data.constituencies) {
        data.constituencies = this.filterConstituencies(data.constituencies, parsedQuery);
      }
      if (data.candidates) {
        data.candidates = this.filterCandidates(data.candidates, parsedQuery);
      }
      if (data.regions) {
        data.regions = this.filterRegions(data.regions, parsedQuery);
      }

      // Apply aggregations
      if (parsedQuery.aggregations.length > 0) {
        data.statistics = this.applyAggregations(data, parsedQuery);
      }

      // Apply sort
      if (parsedQuery.sort) {
        if (data.constituencies) {
          data.constituencies = this.sortConstituencies(data.constituencies, parsedQuery.sort);
        }
        if (data.candidates) {
          data.candidates = this.sortCandidates(data.candidates, parsedQuery.sort);
        }
      }

      // Apply limit
      if (parsedQuery.limit) {
        if (data.constituencies) {
          data.constituencies = data.constituencies.slice(0, parsedQuery.limit);
        }
        if (data.candidates) {
          data.candidates = data.candidates.slice(0, parsedQuery.limit);
        }
        if (data.regions) {
          data.regions = data.regions.slice(0, parsedQuery.limit);
        }
      }

      return data;
    } catch (error) {
      this.logError('Failed to retrieve analytics data', error);
      throw error;
    }
  }

  /**
   * Get constituencies based on query
   */
  private getConstituencies(parsedQuery: ParsedQuery): ConstituencyData[] {
    return [...this.mockConstituencies];
  }

  /**
   * Get candidates based on query
   */
  private getCandidates(parsedQuery: ParsedQuery): CandidateData[] {
    return [...this.mockCandidates];
  }

  /**
   * Get regions based on query
   */
  private getRegions(parsedQuery: ParsedQuery): RegionData[] {
    return [...this.mockRegions];
  }

  /**
   * Get closest races (narrow margins)
   */
  private getClosestRaces(parsedQuery: ParsedQuery): ConstituencyData[] {
    return [...this.mockConstituencies]
      .filter(c => c.margin < 5)
      .sort((a, b) => a.margin - b.margin);
  }

  /**
   * Get highest turnout constituencies
   */
  private getHighestTurnout(parsedQuery: ParsedQuery): ConstituencyData[] {
    return [...this.mockConstituencies]
      .sort((a, b) => b.turnout - a.turnout);
  }

  /**
   * Get flipped constituencies
   */
  private getFlippedConstituencies(parsedQuery: ParsedQuery): ConstituencyData[] {
    return [...this.mockConstituencies]
      .filter(c => c.flipped === true);
  }

  /**
   * Get candidates by momentum
   */
  private getCandidatesByMomentum(parsedQuery: ParsedQuery): CandidateData[] {
    return [...this.mockCandidates]
      .filter(c => c.momentum !== undefined)
      .sort((a, b) => (b.momentum || 0) - (a.momentum || 0));
  }

  /**
   * Get statistics
   */
  private getStatistics(parsedQuery: ParsedQuery): ElectionStatistics {
    return { ...this.mockStatistics };
  }

  /**
   * Filter constituencies
   */
  private filterConstituencies(
    constituencies: ConstituencyData[],
    parsedQuery: ParsedQuery
  ): ConstituencyData[] {
    let filtered = [...constituencies];

    if (parsedQuery.entities.states && parsedQuery.entities.states.length > 0) {
      filtered = filtered.filter(c =>
        parsedQuery.entities.states!.includes(c.state)
      );
    }

    if (parsedQuery.entities.parties && parsedQuery.entities.parties.length > 0) {
      filtered = filtered.filter(c =>
        parsedQuery.entities.parties!.includes(c.party)
      );
    }

    if (parsedQuery.filters.turnout?.min !== undefined) {
      filtered = filtered.filter(c => c.turnout >= parsedQuery.filters.turnout!.min!);
    }

    if (parsedQuery.filters.turnout?.max !== undefined) {
      filtered = filtered.filter(c => c.turnout <= parsedQuery.filters.turnout!.max!);
    }

    if (parsedQuery.filters.margin?.max !== undefined) {
      filtered = filtered.filter(c => c.margin <= parsedQuery.filters.margin!.max!);
    }

    if (parsedQuery.filters.party && parsedQuery.filters.party.length > 0) {
      filtered = filtered.filter(c =>
        parsedQuery.filters.party!.includes(c.party)
      );
    }

    return filtered;
  }

  /**
   * Filter candidates
   */
  private filterCandidates(
    candidates: CandidateData[],
    parsedQuery: ParsedQuery
  ): CandidateData[] {
    let filtered = [...candidates];

    if (parsedQuery.entities.parties && parsedQuery.entities.parties.length > 0) {
      filtered = filtered.filter(c =>
        parsedQuery.entities.parties!.includes(c.party)
      );
    }

    if (parsedQuery.entities.candidates && parsedQuery.entities.candidates.length > 0) {
      filtered = filtered.filter(c =>
        parsedQuery.entities.candidates!.includes(c.name)
      );
    }

    return filtered;
  }

  /**
   * Filter regions
   */
  private filterRegions(
    regions: RegionData[],
    parsedQuery: ParsedQuery
  ): RegionData[] {
    let filtered = [...regions];

    if (parsedQuery.entities.states && parsedQuery.entities.states.length > 0) {
      filtered = filtered.filter(r =>
        parsedQuery.entities.states!.includes(r.name)
      );
    }

    return filtered;
  }

  /**
   * Apply aggregations
   */
  private applyAggregations(
    data: AnalyticsData,
    parsedQuery: ParsedQuery
  ): ElectionStatistics {
    const stats: ElectionStatistics = {
      totalConstituencies: 0,
      totalVotes: 0,
      overallTurnout: 0,
      averageMargin: 0,
      closeRaces: 0,
      flippedConstituencies: 0,
    };

    for (const agg of parsedQuery.aggregations) {
      switch (agg.type) {
        case 'count':
          if (data.constituencies) {
            stats.totalConstituencies = data.constituencies.length;
          }
          if (data.candidates) {
            stats.totalConstituencies = data.candidates.length;
          }
          break;
        case 'sum':
          if (agg.field === 'votes' && data.constituencies) {
            stats.totalVotes = data.constituencies.reduce((sum, c) => sum + c.votes, 0);
          }
          break;
        case 'average':
          if (agg.field === 'turnout' && data.constituencies) {
            stats.overallTurnout = data.constituencies.reduce((sum, c) => sum + c.turnout, 0) / data.constituencies.length;
          }
          if (agg.field === 'margin' && data.constituencies) {
            stats.averageMargin = data.constituencies.reduce((sum, c) => sum + c.margin, 0) / data.constituencies.length;
          }
          break;
        case 'max':
          if (agg.field === 'turnout' && data.constituencies) {
            stats.overallTurnout = Math.max(...data.constituencies.map(c => c.turnout));
          }
          break;
        case 'min':
          if (agg.field === 'turnout' && data.constituencies) {
            stats.overallTurnout = Math.min(...data.constituencies.map(c => c.turnout));
          }
          break;
      }
    }

    return stats;
  }

  /**
   * Sort constituencies
   */
  private sortConstituencies(
    constituencies: ConstituencyData[],
    sort: { field: string; direction: 'asc' | 'desc' }
  ): ConstituencyData[] {
    const fieldMap: Record<string, keyof ConstituencyData> = {
      turnout: 'turnout',
      margin: 'margin',
      votes: 'votes',
      swing: 'swing',
    };

    const field = fieldMap[sort.field];
    if (!field) return constituencies;

    return [...constituencies].sort((a, b) => {
      const aVal = a[field] as number;
      const bVal = b[field] as number;
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  /**
   * Sort candidates
   */
  private sortCandidates(
    candidates: CandidateData[],
    sort: { field: string; direction: 'asc' | 'desc' }
  ): CandidateData[] {
    const fieldMap: Record<string, keyof CandidateData> = {
      votes: 'votes',
      voteShare: 'voteShare',
      momentum: 'momentum',
    };

    const field = fieldMap[sort.field];
    if (!field) return candidates;

    return [...candidates].sort((a, b) => {
      const aVal = (a[field] as number) || 0;
      const bVal = (b[field] as number) || 0;
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  /**
   * Get chart configuration for data
   */
  getChartConfig(data: AnalyticsData, parsedQuery: ParsedQuery): ChartConfig[] {
    const configs: ChartConfig[] = [];

    if (data.constituencies && data.constituencies.length > 0) {
      configs.push({
        type: 'bar',
        title: 'Constituency Turnout',
        data: {
          labels: data.constituencies.map(c => c.name),
          datasets: [{
            label: 'Turnout %',
            data: data.constituencies.map(c => c.turnout),
          }],
        },
      });
    }

    if (data.candidates && data.candidates.length > 0) {
      configs.push({
        type: 'pie',
        title: 'Vote Share Distribution',
        data: {
          labels: data.candidates.map(c => c.name),
          datasets: [{
            data: data.candidates.map(c => c.voteShare),
          }],
        },
      });
    }

    if (data.regions && data.regions.length > 0) {
      configs.push({
        type: 'bar',
        title: 'Regional Performance',
        data: {
          labels: data.regions.map(r => r.name),
          datasets: [{
            label: 'Turnout %',
            data: data.regions.map(r => r.turnout),
          }],
        },
      });
    }

    return configs;
  }
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
}

// Singleton instance
let analyticsRetrieverService: AnalyticsRetrieverService | null = null;

export function getAnalyticsRetrieverService(): AnalyticsRetrieverService {
  if (!analyticsRetrieverService) {
    analyticsRetrieverService = new AnalyticsRetrieverService();
  }
  return analyticsRetrieverService;
}
