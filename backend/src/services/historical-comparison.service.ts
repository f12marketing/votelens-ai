import { BaseService } from './base.service';
import {
  ElectionComparison,
  ComparisonRequest,
  ComparisonFilter,
  VoteShareChange,
  TurnoutShift,
  PartyPerformanceChange,
  ConstituencySwing,
  RegionalComparison,
  ComparisonSummary,
  ChartConfig,
} from '../types/comparison.schema';

export class HistoricalComparisonService extends BaseService {
  // Mock data - in production, this would query the database
  private mockElectionData: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock election data for 2019
    this.mockElectionData.set('election-2019', {
      year: 2019,
      turnout: 66.4,
      totalVotes: 890000000,
      parties: [
        { party: 'BJP', voteShare: 37.4, seats: 303 },
        { party: 'INC', voteShare: 19.5, seats: 52 },
        { party: 'DMK', voteShare: 3.3, seats: 23 },
        { party: 'TMC', voteShare: 4.1, seats: 22 },
        { party: 'BSP', voteShare: 3.6, seats: 10 },
      ],
      constituencies: [
        { id: 'c1', name: 'Mumbai North', state: 'Maharashtra', turnout: 63.2, winner: 'BJP', party: 'BJP', margin: 5.2 },
        { id: 'c2', name: 'Delhi East', state: 'Delhi', turnout: 70.5, winner: 'BJP', party: 'BJP', margin: 8.3 },
        { id: 'c3', name: 'Bangalore South', state: 'Karnataka', turnout: 67.8, winner: 'INC', party: 'INC', margin: 2.1 },
        { id: 'c4', name: 'Chennai Central', state: 'Tamil Nadu', turnout: 74.2, winner: 'DMK', party: 'DMK', margin: 9.5 },
        { id: 'c5', name: 'Kolkata North', state: 'West Bengal', turnout: 72.1, winner: 'TMC', party: 'TMC', margin: 6.8 },
      ],
    });

    // Mock election data for 2024
    this.mockElectionData.set('election-2024', {
      year: 2024,
      turnout: 68.7,
      totalVotes: 920000000,
      parties: [
        { party: 'BJP', voteShare: 36.5, seats: 240 },
        { party: 'INC', voteShare: 21.2, seats: 99 },
        { party: 'DMK', voteShare: 3.8, seats: 22 },
        { party: 'TMC', voteShare: 4.3, seats: 29 },
        { party: 'BSP', voteShare: 2.9, seats: 5 },
      ],
      constituencies: [
        { id: 'c1', name: 'Mumbai North', state: 'Maharashtra', turnout: 65.5, winner: 'INC', party: 'INC', margin: 2.3 },
        { id: 'c2', name: 'Delhi East', state: 'Delhi', turnout: 72.1, winner: 'BJP', party: 'BJP', margin: 5.8 },
        { id: 'c3', name: 'Bangalore South', state: 'Karnataka', turnout: 68.9, winner: 'INC', party: 'INC', margin: 1.2 },
        { id: 'c4', name: 'Chennai Central', state: 'Tamil Nadu', turnout: 75.3, winner: 'DMK', party: 'DMK', margin: 8.5 },
        { id: 'c5', name: 'Kolkata North', state: 'West Bengal', turnout: 71.8, winner: 'TMC', party: 'TMC', margin: 3.7 },
      ],
    });
  }

  /**
   * Compare two elections
   */
  async compareElections(request: ComparisonRequest): Promise<ElectionComparison> {
    const election1 = this.mockElectionData.get(request.electionId1);
    const election2 = this.mockElectionData.get(request.electionId2);

    if (!election1 || !election2) {
      throw new Error('Election data not found');
    }

    const voteShareChanges = this.calculateVoteShareChanges(election1, election2);
    const turnoutShifts = this.calculateTurnoutShifts(election1, election2);
    const partyPerformanceChanges = this.calculatePartyPerformanceChanges(election1, election2);
    const constituencySwings = this.calculateConstituencySwings(election1, election2);
    const regionalComparisons = this.calculateRegionalComparisons(election1, election2);
    const summary = this.generateSummary(election1, election2, constituencySwings, voteShareChanges);

    return {
      electionId1: request.electionId1,
      electionId2: request.electionId2,
      year1: election1.year,
      year2: election2.year,
      voteShareChanges,
      turnoutShifts,
      partyPerformanceChanges,
      constituencySwings,
      regionalComparisons,
      summary,
    };
  }

  /**
   * Calculate vote share changes
   */
  private calculateVoteShareChanges(election1: any, election2: any): VoteShareChange[] {
    const changes: VoteShareChange[] = [];

    // Get all parties from both elections
    const allParties = new Set([
      ...election1.parties.map((p: any) => p.party),
      ...election2.parties.map((p: any) => p.party),
    ]);

    allParties.forEach(party => {
      const party1 = election1.parties.find((p: any) => p.party === party);
      const party2 = election2.parties.find((p: any) => p.party === party);

      const year1Share = party1 ? party1.voteShare : 0;
      const year2Share = party2 ? party2.voteShare : 0;
      const change = year2Share - year1Share;
      const changePercentage = year1Share > 0 ? (change / year1Share) * 100 : 0;

      let trend: 'gaining' | 'losing' | 'stable' = 'stable';
      if (change > 1) trend = 'gaining';
      else if (change < -1) trend = 'losing';

      changes.push({
        party,
        year1Share,
        year2Share,
        change,
        changePercentage,
        trend,
        seatsChange: (party2?.seats || 0) - (party1?.seats || 0),
      });
    });

    return changes.sort((a, b) => b.change - a.change);
  }

  /**
   * Calculate turnout shifts
   */
  private calculateTurnoutShifts(election1: any, election2: any): TurnoutShift[] {
    const shifts: TurnoutShift[] = [];

    election1.constituencies.forEach((c1: any) => {
      const c2 = election2.constituencies.find((c: any) => c.id === c1.id);
      if (c2) {
        const change = c2.turnout - c1.turnout;
        const changePercentage = (change / c1.turnout) * 100;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (change > 2) trend = 'increasing';
        else if (change < -2) trend = 'decreasing';

        shifts.push({
          constituencyId: c1.id,
          constituencyName: c1.name,
          state: c1.state,
          year1Turnout: c1.turnout,
          year2Turnout: c2.turnout,
          change,
          changePercentage,
          trend,
        });
      }
    });

    return shifts.sort((a, b) => b.change - a.change);
  }

  /**
   * Calculate party performance changes
   */
  private calculatePartyPerformanceChanges(election1: any, election2: any): PartyPerformanceChange[] {
    const changes: PartyPerformanceChange[] = [];

    election1.parties.forEach((p1: any) => {
      const p2 = election2.parties.find((p: any) => p.party === p1.party);
      if (p2) {
        const seatsChange = p2.seats - p1.seats;
        const voteShareChange = p2.voteShare - p1.voteShare;

        let performance: 'improving' | 'declining' | 'stable' = 'stable';
        if (seatsChange > 0 && voteShareChange > 0) performance = 'improving';
        else if (seatsChange < 0 && voteShareChange < 0) performance = 'declining';

        changes.push({
          party: p1.party,
          year1Seats: p1.seats,
          year2Seats: p2.seats,
          seatsChange,
          year1VoteShare: p1.voteShare,
          year2VoteShare: p2.voteShare,
          voteShareChange,
          performance,
        });
      }
    });

    return changes.sort((a, b) => b.seatsChange - a.seatsChange);
  }

  /**
   * Calculate constituency swings
   */
  private calculateConstituencySwings(election1: any, election2: any): ConstituencySwing[] {
    const swings: ConstituencySwing[] = [];

    election1.constituencies.forEach((c1: any) => {
      const c2 = election2.constituencies.find((c: any) => c.id === c1.id);
      if (c2) {
        const flipped = c1.party !== c2.party;
        const swing = Math.abs(c2.margin - c1.margin);

        let swingType: 'toward_party' | 'away_from_party' | 'neutral' = 'neutral';
        if (flipped) {
          swingType = 'toward_party';
        } else if (swing > 3) {
          swingType = 'away_from_party';
        }

        swings.push({
          constituencyId: c1.id,
          constituencyName: c1.name,
          state: c1.state,
          year1Winner: c1.winner,
          year1Party: c1.party,
          year1Margin: c1.margin,
          year2Winner: c2.winner,
          year2Party: c2.party,
          year2Margin: c2.margin,
          swing,
          flipped,
          swingType,
        });
      }
    });

    return swings.sort((a, b) => b.swing - a.swing);
  }

  /**
   * Calculate regional comparisons
   */
  private calculateRegionalComparisons(election1: any, election2: any): RegionalComparison[] {
    const comparisons: RegionalComparison[] = [];

    const regions = new Set([
      ...election1.constituencies.map((c: any) => c.state),
      ...election2.constituencies.map((c: any) => c.state),
    ]);

    regions.forEach(region => {
      const region1 = election1.constituencies.filter((c: any) => c.state === region);
      const region2 = election2.constituencies.filter((c: any) => c.state === region);

      if (region1.length > 0 && region2.length > 0) {
        const turnout1 = region1.reduce((sum: number, c: any) => sum + c.turnout, 0) / region1.length;
        const turnout2 = region2.reduce((sum: number, c: any) => sum + c.turnout, 0) / region2.length;

        const party1 = region1[0].party;
        const party2 = region2[0].party;

        const swing = Math.abs(turnout2 - turnout1);

        comparisons.push({
          region,
          year1Turnout: turnout1,
          year2Turnout: turnout2,
          turnoutChange: turnout2 - turnout1,
          year1WinningParty: party1,
          year2WinningParty: party2,
          partyChange: party1 !== party2,
          year1VoteShareDistribution: [],
          year2VoteShareDistribution: [],
          swing,
        });
      }
    });

    return comparisons.sort((a, b) => b.turnoutChange - a.turnoutChange);
  }

  /**
   * Generate comparison summary
   */
  private generateSummary(
    election1: any,
    election2: any,
    constituencySwings: ConstituencySwing[],
    voteShareChanges: VoteShareChange[]
  ): ComparisonSummary {
    const overallTurnoutChange = election2.turnout - election1.turnout;
    const overallTurnoutChangePercentage = (overallTurnoutChange / election1.turnout) * 100;

    const totalFlipped = constituencySwings.filter(s => s.flipped).length;

    const biggestGainer = voteShareChanges
      .filter(c => c.trend === 'gaining')
      .sort((a, b) => b.change - a.change)[0]?.party || 'None';

    const biggestLoser = voteShareChanges
      .filter(c => c.trend === 'losing')
      .sort((a, b) => a.change - b.change)[0]?.party || 'None';

    const averageSwing = constituencySwings.reduce((sum, s) => sum + s.swing, 0) / constituencySwings.length;

    const keyInsights = [
      `Overall turnout changed by ${overallTurnoutChangePercentage.toFixed(1)}%`,
      `${totalFlipped} constituencies flipped parties`,
      `${biggestGainer} gained the most vote share`,
      `${biggestLoser} lost the most vote share`,
      `Average swing was ${averageSwing.toFixed(1)}%`,
    ];

    return {
      overallTurnoutChange,
      overallTurnoutChangePercentage,
      totalFlippedConstituencies: totalFlipped,
      biggestGainer,
      biggestLoser,
      averageSwing,
      keyInsights,
    };
  }

  /**
   * Apply filters to comparison data
   */
  applyFilters(comparison: ElectionComparison, filters: ComparisonFilter): ElectionComparison {
    let filtered = { ...comparison };

    if (filters.state && filters.state.length > 0) {
      filtered.turnoutShifts = filtered.turnoutShifts.filter(t => filters.state!.includes(t.state));
      filtered.constituencySwings = filtered.constituencySwings.filter(s => filters.state!.includes(s.state));
    }

    if (filters.party && filters.party.length > 0) {
      filtered.voteShareChanges = filtered.voteShareChanges.filter(v => filters.party!.includes(v.party));
      filtered.partyPerformanceChanges = filtered.partyPerformanceChanges.filter(p => filters.party!.includes(p.party));
    }

    if (filters.flippedOnly) {
      filtered.constituencySwings = filtered.constituencySwings.filter(s => s.flipped);
    }

    if (filters.minSwing !== undefined) {
      filtered.constituencySwings = filtered.constituencySwings.filter(s => s.swing >= filters.minSwing!);
    }

    if (filters.maxSwing !== undefined) {
      filtered.constituencySwings = filtered.constituencySwings.filter(s => s.swing <= filters.maxSwing!);
    }

    if (filters.turnoutChangeRange) {
      filtered.turnoutShifts = filtered.turnoutShifts.filter(t => 
        t.change >= filters.turnoutChangeRange!.min && t.change <= filters.turnoutChangeRange!.max
      );
    }

    if (filters.voteShareChangeRange) {
      filtered.voteShareChanges = filtered.voteShareChanges.filter(v => 
        v.change >= filters.voteShareChangeRange!.min && v.change <= filters.voteShareChangeRange!.max
      );
    }

    return filtered;
  }

  /**
   * Generate chart configurations
   */
  generateCharts(comparison: ElectionComparison): ChartConfig[] {
    const charts: ChartConfig[] = [];

    // Vote share change chart
    charts.push({
      type: 'bar',
      title: 'Vote Share Changes',
      data: {
        labels: comparison.voteShareChanges.map(c => c.party),
        datasets: [{
          label: 'Change %',
          data: comparison.voteShareChanges.map(c => c.changePercentage),
          backgroundColor: comparison.voteShareChanges.map(c => 
            c.trend === 'gaining' ? '#22c55e' : 
            c.trend === 'losing' ? '#ef4444' : 
            '#9ca3af'
          ),
        }],
      },
    });

    // Turnout shift chart
    charts.push({
      type: 'bar',
      title: 'Turnout Shifts by Constituency',
      data: {
        labels: comparison.turnoutShifts.map(t => t.constituencyName),
        datasets: [{
          label: 'Turnout Change %',
          data: comparison.turnoutShifts.map(t => t.changePercentage),
          backgroundColor: comparison.turnoutShifts.map(t => 
            t.trend === 'increasing' ? '#22c55e' : 
            t.trend === 'decreasing' ? '#ef4444' : 
            '#9ca3af'
          ),
        }],
      },
    });

    // Party performance chart
    charts.push({
      type: 'bar',
      title: 'Party Seat Changes',
      data: {
        labels: comparison.partyPerformanceChanges.map(p => p.party),
        datasets: [{
          label: 'Seat Change',
          data: comparison.partyPerformanceChanges.map(p => p.seatsChange),
          backgroundColor: comparison.partyPerformanceChanges.map(p => 
            p.performance === 'improving' ? '#22c55e' : 
            p.performance === 'declining' ? '#ef4444' : 
            '#9ca3af'
          ),
        }],
      },
    });

    // Regional comparison chart
    charts.push({
      type: 'bar',
      title: 'Regional Turnout Changes',
      data: {
        labels: comparison.regionalComparisons.map(r => r.region),
        datasets: [{
          label: 'Turnout Change %',
          data: comparison.regionalComparisons.map(r => r.turnoutChange),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        }],
      },
    });

    return charts;
  }
}

// Singleton instance
let historicalComparisonService: HistoricalComparisonService | null = null;

export function getHistoricalComparisonService(): HistoricalComparisonService {
  if (!historicalComparisonService) {
    historicalComparisonService = new HistoricalComparisonService();
  }
  return historicalComparisonService;
}
