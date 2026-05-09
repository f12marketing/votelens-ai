import { apiClient } from './client';

// Types for analytics responses
export interface TurnoutAnalysis {
  overall_turnout: number;
  turnout_by_constituency: Array<{
    constituency_id: string;
    constituency_name: string;
    turnout: number;
    total_voters: number;
    votes_cast: number;
  }>;
  turnout_by_region: Array<{
    region: string;
    turnout: number;
    total_voters: number;
    votes_cast: number;
  }>;
  turnout_trend: Array<{
    year: number;
    turnout: number;
  }>;
  high_turnout_constituencies: Array<{
    constituency_id: string;
    constituency_name: string;
    turnout: number;
  }>;
  low_turnout_constituencies: Array<{
    constituency_id: string;
    constituency_name: string;
    turnout: number;
  }>;
}

export interface VoteShareAnalysis {
  overall_vote_share: Array<{
    party: string;
    votes: number;
    vote_share: number;
    seats_won: number;
  }>;
  vote_share_by_constituency: Array<{
    constituency_id: string;
    constituency_name: string;
    party: string;
    votes: number;
    vote_share: number;
  }>;
  vote_share_by_region: Array<{
    region: string;
    party: string;
    votes: number;
    vote_share: number;
  }>;
  vote_share_trend: Array<{
    year: number;
    party: string;
    vote_share: number;
  }>;
}

export interface SeatDistribution {
  total_seats: number;
  seats_by_party: Array<{
    party: string;
    seats_won: number;
    seat_percentage: number;
    vote_share: number;
    swing: number;
  }>;
  seats_by_region: Array<{
    region: string;
    total_seats: number;
    party_distribution: Array<{
      party: string;
      seats: number;
    }>;
  }>;
  majority_threshold: number;
  leading_party: {
    party: string;
    seats: number;
    percentage: number;
  };
}

export interface ConstituencyRanking {
  rankings: Array<{
    rank: number;
    constituency_id: string;
    constituency_name: string;
    state: string;
    total_votes: number;
    turnout: number;
    winner: {
      name: string;
      party: string;
      votes: number;
      vote_share: number;
    };
    margin: number;
    margin_percentage: number;
    competitive_index: number;
  }>;
  criteria: string;
}

export interface SwingAnalysis {
  overall_swing: Array<{
    party: string;
    current_vote_share: number;
    previous_vote_share: number;
    swing: number;
  }>;
  swing_by_constituency: Array<{
    constituency_id: string;
    constituency_name: string;
    party: string;
    current_vote_share: number;
    previous_vote_share: number;
    swing: number;
  }>;
  swing_by_region: Array<{
    region: string;
    party: string;
    swing: number;
  }>;
  significant_swings: Array<{
    party: string;
    swing: number;
    constituencies_affected: number;
  }>;
}

export interface HistoricalComparison {
  elections: Array<{
    election_id: string;
    year: number;
    name: string;
    total_voters: number;
    turnout: number;
    total_seats: number;
    winning_party: string;
  }>;
  turnout_comparison: Array<{
    year: number;
    turnout: number;
    change: number;
  }>;
  party_performance_comparison: Array<{
    party: string;
    years: Array<{
      year: number;
      vote_share: number;
      seats_won: number;
    }>;
  }>;
  key_changes: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
}

export interface CloseContestDetection {
  close_contests: Array<{
    constituency_id: string;
    constituency_name: string;
    state: string;
    margin: number;
    margin_percentage: number;
    winner: {
      name: string;
      party: string;
      votes: number;
    };
    runner_up: {
      name: string;
      party: string;
      votes: number;
    };
    total_candidates: number;
  }>;
  statistics: {
    total_close_contests: number;
    percentage_of_total: number;
    average_margin: number;
    most_competitive_region: string;
  };
}

export interface RegionalAnalysis {
  regions: Array<{
    name: string;
    total_constituencies: number;
    total_voters: number;
    turnout: number;
    leading_party: string;
    party_distribution: Array<{
      party: string;
      votes: number;
      vote_share: number;
      seats_won: number;
    }>;
    key_insights: string[];
  }>;
  regional_comparison: Array<{
    region: string;
    metric: string;
    value: number;
    rank: number;
  }>;
  regional_trends: Array<{
    region: string;
    year: number;
    turnout: number;
    leading_party: string;
  }>;
}

// Analytics API functions
export const analyticsApi = {
  // Get turnout analysis
  getTurnoutAnalysis: async (electionId: string) => {
    const response = await apiClient.get<TurnoutAnalysis>(
      `/analytics/election/${electionId}/turnout`
    );
    return response.data;
  },

  // Get vote share analysis
  getVoteShareAnalysis: async (electionId: string) => {
    const response = await apiClient.get<VoteShareAnalysis>(
      `/analytics/election/${electionId}/vote-share`
    );
    return response.data;
  },

  // Get seat distribution
  getSeatDistribution: async (electionId: string) => {
    const response = await apiClient.get<SeatDistribution>(
      `/analytics/election/${electionId}/seat-distribution`
    );
    return response.data;
  },

  // Get constituency ranking
  getConstituencyRanking: async (
    electionId: string,
    criteria: 'turnout' | 'margin' | 'competitive' = 'turnout'
  ) => {
    const response = await apiClient.get<ConstituencyRanking>(
      `/analytics/election/${electionId}/ranking`,
      { params: { criteria } }
    );
    return response.data;
  },

  // Get swing analysis
  getSwingAnalysis: async (electionId: string, previousElectionId?: string) => {
    const response = await apiClient.get<SwingAnalysis>(
      `/analytics/election/${electionId}/swing`,
      { params: previousElectionId ? { previousElectionId } : {} }
    );
    return response.data;
  },

  // Get historical comparison
  getHistoricalComparison: async (electionId: string, compareWithYears?: number[]) => {
    const response = await apiClient.get<HistoricalComparison>(
      `/analytics/election/${electionId}/historical`,
      { params: compareWithYears ? { compareWithYears: compareWithYears.join(',') } : {} }
    );
    return response.data;
  },

  // Get close contests
  getCloseContests: async (electionId: string, marginThreshold: number = 5) => {
    const response = await apiClient.get<CloseContestDetection>(
      `/analytics/election/${electionId}/close-contests`,
      { params: { marginThreshold } }
    );
    return response.data;
  },

  // Get regional analysis
  getRegionalAnalysis: async (electionId: string) => {
    const response = await apiClient.get<RegionalAnalysis>(
      `/analytics/election/${electionId}/regional`
    );
    return response.data;
  },
};
