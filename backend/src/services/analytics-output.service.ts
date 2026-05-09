import { BaseService } from './base.service';
import { NormalizedRow } from './normalization.service';

export interface AnalyticsConstituency {
  id: string;
  name: string;
  name_normalized: string;
  state?: string;
  state_normalized?: string;
  district?: string;
  district_normalized?: string;
  total_votes: number;
  total_voters: number;
  turnout_percentage: number;
  candidate_count: number;
  winner: {
    name: string;
    name_normalized: string;
    party: string;
    party_normalized: string;
    votes: number;
    vote_share: number;
    margin: number;
  };
  runner_up: {
    name: string;
    name_normalized: string;
    party: string;
    party_normalized: string;
    votes: number;
    vote_share: number;
  };
  candidates: AnalyticsCandidate[];
  metrics: {
    margin_percentage: number;
    swing?: number;
    competitive_index: number;
  };
}

export interface AnalyticsCandidate {
  name: string;
  name_normalized: string;
  party: string;
  party_normalized: string;
  votes: number;
  vote_share: number;
  turnout?: number;
  margin: number;
  rank: number;
  is_winner: boolean;
}

export interface AnalyticsElection {
  election_id?: string;
  election_name?: string;
  year?: number;
  total_constituencies: number;
  total_candidates: number;
  total_votes: number;
  total_voters: number;
  overall_turnout: number;
  constituencies: AnalyticsConstituency[];
  summary: {
    party_performance: PartyPerformance[];
    state_performance: StatePerformance[];
    key_insights: string[];
  };
}

export interface PartyPerformance {
  party: string;
  party_normalized: string;
  total_votes: number;
  vote_share: number;
  constituencies_won: number;
  constituencies_contested: number;
  win_rate: number;
  average_margin: number;
}

export interface StatePerformance {
  state: string;
  state_normalized: string;
  constituencies: number;
  total_votes: number;
  turnout: number;
  leading_party: string;
  competitive_constituencies: number;
}

export class AnalyticsOutputService extends BaseService {
  /**
   * Generate analytics-ready structured dataset
   */
  generateAnalyticsDataset(normalizedData: NormalizedRow[], options: {
    electionId?: string;
    electionName?: string;
    year?: number;
  } = {}): AnalyticsElection {
    this.logInfo('Generating analytics dataset', { rowCount: normalizedData.length });

    // Group by constituency
    const constituencyGroups = this.groupByConstituency(normalizedData);

    // Process each constituency
    const constituencies = Array.from(constituencyGroups.values()).map(group => 
      this.processConstituency(group)
    );

    // Calculate overall metrics
    const totalVotes = constituencies.reduce((sum: number, c) => sum + c.total_votes, 0);
    const totalVoters = constituencies.reduce((sum: number, c) => sum + c.total_voters, 0);
    const overallTurnout = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

    // Calculate party performance
    const partyPerformance = this.calculatePartyPerformance(normalizedData, constituencies);

    // Calculate state performance
    const statePerformance = this.calculateStatePerformance(constituencies);

    // Generate key insights
    const keyInsights = this.generateKeyInsights(constituencies, partyPerformance, statePerformance);

    const analyticsElection: AnalyticsElection = {
      election_id: options.electionId,
      election_name: options.electionName,
      year: options.year,
      total_constituencies: constituencies.length,
      total_candidates: normalizedData.length,
      total_votes: totalVotes,
      total_voters: totalVoters,
      overall_turnout: overallTurnout,
      constituencies,
      summary: {
        party_performance: partyPerformance,
        state_performance: statePerformance,
        key_insights: keyInsights,
      },
    };

    this.logInfo('Analytics dataset generated', {
      constituencies: analyticsElection.total_constituencies,
      candidates: analyticsElection.total_candidates,
      parties: partyPerformance.length,
      states: statePerformance.length,
    });

    return analyticsElection;
  }

  /**
   * Group data by constituency
   */
  private groupByConstituency(data: NormalizedRow[]): Map<string, NormalizedRow[]> {
    const groups = new Map<string, NormalizedRow[]>();

    data.forEach(row => {
      const key = row.constituency_normalized;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    });

    return groups;
  }

  /**
   * Process a single constituency
   */
  private processConstituency(rows: NormalizedRow[]): AnalyticsConstituency {
    const firstRow = rows[0];
    const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);
    const totalVoters = firstRow.voter_count || 0;
    const turnoutPercentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

    // Sort by votes (descending)
    const sortedRows = [...rows].sort((a, b) => b.votes - a.votes);

    const winner = sortedRows[0];
    const runnerUp = sortedRows.length > 1 ? sortedRows[1] : null;

    // Calculate margin percentage
    const marginPercentage = runnerUp 
      ? ((winner.votes - runnerUp.votes) / totalVotes) * 100 
      : 100;

    // Calculate competitive index (inverse of margin)
    const competitiveIndex = 100 - marginPercentage;

    // Build candidates array
    const candidates: AnalyticsCandidate[] = sortedRows.map((row, index) => ({
      name: row.candidate,
      name_normalized: row.candidate_normalized,
      party: row.party,
      party_normalized: row.party_normalized,
      votes: row.votes,
      vote_share: row.vote_share || 0,
      turnout: row.turnout,
      margin: row.margin || 0,
      rank: index + 1,
      is_winner: index === 0,
    }));

    return {
      id: firstRow.constituency_normalized,
      name: firstRow.constituency,
      name_normalized: firstRow.constituency_normalized,
      state: firstRow.state,
      state_normalized: firstRow.state_normalized,
      district: firstRow.district,
      district_normalized: firstRow.district_normalized,
      total_votes: totalVotes,
      total_voters: totalVoters,
      turnout_percentage: Number(turnoutPercentage.toFixed(2)),
      candidate_count: rows.length,
      winner: {
        name: winner.candidate,
        name_normalized: winner.candidate_normalized,
        party: winner.party,
        party_normalized: winner.party_normalized,
        votes: winner.votes,
        vote_share: winner.vote_share || 0,
        margin: winner.margin || 0,
      },
      runner_up: runnerUp ? {
        name: runnerUp.candidate,
        name_normalized: runnerUp.candidate_normalized,
        party: runnerUp.party,
        party_normalized: runnerUp.party_normalized,
        votes: runnerUp.votes,
        vote_share: runnerUp.vote_share || 0,
      } : {
        name: '',
        name_normalized: '',
        party: '',
        party_normalized: '',
        votes: 0,
        vote_share: 0,
      },
      candidates,
      metrics: {
        margin_percentage: Number(marginPercentage.toFixed(2)),
        swing: winner.swing,
        competitive_index: Number(competitiveIndex.toFixed(2)),
      },
    };
  }

  /**
   * Calculate party performance across all constituencies
   */
  private calculatePartyPerformance(
    data: NormalizedRow[],
    constituencies: AnalyticsConstituency[]
  ): PartyPerformance[] {
    const partyMap = new Map<string, {
      party: string;
      party_normalized: string;
      total_votes: number;
      constituencies_won: number;
      constituencies_contested: number;
      margins: number[];
    }>();

    // Initialize party data
    data.forEach(row => {
      const key = row.party_normalized;
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          party: row.party,
          party_normalized: row.party_normalized,
          total_votes: 0,
          constituencies_won: 0,
          constituencies_contested: 0,
          margins: [],
        });
      }
      const party = partyMap.get(key)!;
      party.total_votes += row.votes;
      party.constituencies_contested++;
    });

    // Count wins and collect margins
    constituencies.forEach(constituency => {
      const winnerParty = constituency.winner.party_normalized;
      const party = partyMap.get(winnerParty);
      if (party) {
        party.constituencies_won++;
        party.margins.push(constituency.metrics.margin_percentage);
      }
    });

    // Calculate metrics for each party
    const totalVotes = data.reduce((sum, row) => sum + row.votes, 0);
    const performance: PartyPerformance[] = [];

    partyMap.forEach((data) => {
      const voteShare = totalVotes > 0 ? (data.total_votes / totalVotes) * 100 : 0;
      const winRate = data.constituencies_contested > 0 
        ? (data.constituencies_won / data.constituencies_contested) * 100 
        : 0;
      const averageMargin = data.margins.length > 0 
        ? data.margins.reduce((sum, m) => sum + m, 0) / data.margins.length 
        : 0;

      performance.push({
        party: data.party,
        party_normalized: data.party_normalized,
        total_votes: data.total_votes,
        vote_share: Number(voteShare.toFixed(2)),
        constituencies_won: data.constituencies_won,
        constituencies_contested: data.constituencies_contested,
        win_rate: Number(winRate.toFixed(2)),
        average_margin: Number(averageMargin.toFixed(2)),
      });
    });

    // Sort by vote share (descending)
    return performance.sort((a, b) => b.vote_share - a.vote_share);
  }

  /**
   * Calculate state performance
   */
  private calculateStatePerformance(constituencies: AnalyticsConstituency[]): StatePerformance[] {
    const stateMap = new Map<string, {
      state: string;
      state_normalized: string;
      constituencies: number;
      total_votes: number;
      total_voters: number;
      party_votes: Map<string, number>;
    }>();

    // Group by state
    constituencies.forEach(constituency => {
      const stateKey = constituency.state_normalized || 'Unknown';
      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, {
          state: constituency.state || 'Unknown',
          state_normalized: stateKey,
          constituencies: 0,
          total_votes: 0,
          total_voters: 0,
          party_votes: new Map(),
        });
      }
      const state = stateMap.get(stateKey)!;
      state.constituencies++;
      state.total_votes += constituency.total_votes;
      state.total_voters += constituency.total_voters;

      // Track party votes in this state
      const winnerParty = constituency.winner.party_normalized;
      const currentPartyVotes = state.party_votes.get(winnerParty) || 0;
      state.party_votes.set(winnerParty, currentPartyVotes + constituency.winner.votes);
    });

    // Calculate performance for each state
    const performance: StatePerformance[] = [];

    stateMap.forEach((data) => {
      const turnout = data.total_voters > 0 ? (data.total_votes / data.total_voters) * 100 : 0;

      // Find leading party in state
      let leadingParty = '';
      let maxVotes = 0;
      data.party_votes.forEach((votes, party) => {
        if (votes > maxVotes) {
          maxVotes = votes;
          leadingParty = party;
        }
      });

      // Count competitive constituencies (margin < 10%)
      const competitiveConstituencies = constituencies.filter(c => 
        c.state_normalized === data.state_normalized && 
        c.metrics.margin_percentage < 10
      ).length;

      performance.push({
        state: data.state,
        state_normalized: data.state_normalized,
        constituencies: data.constituencies,
        total_votes: data.total_votes,
        turnout: Number(turnout.toFixed(2)),
        leading_party: leadingParty,
        competitive_constituencies: competitiveConstituencies,
      });
    });

    // Sort by constituencies (descending)
    return performance.sort((a, b) => b.constituencies - a.constituencies);
  }

  /**
   * Generate key insights from the data
   */
  private generateKeyInsights(
    constituencies: AnalyticsConstituency[],
    partyPerformance: PartyPerformance[],
    statePerformance: StatePerformance[]
  ): string[] {
    const insights: string[] = [];

    // Overall turnout insight
    const avgTurnout = constituencies.reduce((sum, c) => sum + c.turnout_percentage, 0) / constituencies.length;
    insights.push(`Overall turnout: ${avgTurnout.toFixed(1)}%`);

    // Leading party insight
    if (partyPerformance.length > 0) {
      const leadingParty = partyPerformance[0];
      insights.push(`Leading party: ${leadingParty.party} with ${leadingParty.vote_share.toFixed(1)}% vote share`);
      insights.push(`${leadingParty.party} won ${leadingParty.constituencies_won} constituencies`);
    }

    // Competitive constituencies insight
    const competitiveCount = constituencies.filter(c => c.metrics.margin_percentage < 10).length;
    const competitivePercentage = (competitiveCount / constituencies.length) * 100;
    insights.push(`${competitiveCount} constituencies (${competitivePercentage.toFixed(1)}%) are highly competitive (margin < 10%)`);

    // State with highest turnout
    const stateWithHighestTurnout = [...statePerformance].sort((a, b) => b.turnout - a.turnout)[0];
    if (stateWithHighestTurnout) {
      insights.push(`${stateWithHighestTurnout.state} has the highest turnout at ${stateWithHighestTurnout.turnout.toFixed(1)}%`);
    }

    // Average margin insight
    const avgMargin = constituencies.reduce((sum, c) => sum + c.metrics.margin_percentage, 0) / constituencies.length;
    insights.push(`Average victory margin: ${avgMargin.toFixed(1)}%`);

    return insights;
  }

  /**
   * Export analytics dataset as JSON
   */
  exportAsJSON(analyticsElection: AnalyticsElection): string {
    return JSON.stringify(analyticsElection, null, 2);
  }

  /**
   * Export analytics dataset as CSV
   */
  exportAsCSV(analyticsElection: AnalyticsElection): string {
    const headers = [
      'Constituency',
      'State',
      'District',
      'Candidate',
      'Party',
      'Votes',
      'Vote Share',
      'Turnout',
      'Margin',
      'Rank',
      'Is Winner',
    ];

    const rows: string[][] = [headers];

    analyticsElection.constituencies.forEach(constituency => {
      constituency.candidates.forEach(candidate => {
        rows.push([
          constituency.name,
          constituency.state || '',
          constituency.district || '',
          candidate.name,
          candidate.party,
          candidate.votes.toString(),
          candidate.vote_share.toFixed(2),
          constituency.turnout_percentage.toFixed(2),
          candidate.margin.toString(),
          candidate.rank.toString(),
          candidate.is_winner ? 'Yes' : 'No',
        ]);
      });
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Generate summary statistics
   */
  generateSummaryStatistics(analyticsElection: AnalyticsElection): {
    total_constituencies: number;
    total_candidates: number;
    total_votes: number;
    overall_turnout: number;
    average_margin: number;
    competitive_constituencies: number;
    leading_party: string;
    most_competitive_state: string;
  } {
    const avgMargin = analyticsElection.constituencies.reduce(
      (sum, c) => sum + c.metrics.margin_percentage,
      0
    ) / analyticsElection.constituencies.length;

    const competitiveCount = analyticsElection.constituencies.filter(
      c => c.metrics.margin_percentage < 10
    ).length;

    const leadingParty = analyticsElection.summary.party_performance[0]?.party || 'Unknown';

    const mostCompetitiveState = [...analyticsElection.summary.state_performance]
      .sort((a, b) => b.competitive_constituencies - a.competitive_constituencies)[0]?.state || 'Unknown';

    return {
      total_constituencies: analyticsElection.total_constituencies,
      total_candidates: analyticsElection.total_candidates,
      total_votes: analyticsElection.total_votes,
      overall_turnout: analyticsElection.overall_turnout,
      average_margin: Number(avgMargin.toFixed(2)),
      competitive_constituencies: competitiveCount,
      leading_party: leadingParty,
      most_competitive_state: mostCompetitiveState,
    };
  }
}

export const analyticsOutputService = new AnalyticsOutputService();
