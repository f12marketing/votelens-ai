import React, { useState } from 'react';
import { AIInsightBanner, AIInsightBannerSkeleton } from './AIInsightBanner';
import { SummaryCards, SummaryCardsSkeleton } from './SummaryCards';
import { TurnoutCharts, TurnoutChartsSkeleton } from './TurnoutCharts';
import { VoteShareCharts, VoteShareChartsSkeleton } from './VoteShareCharts';
import { SeatDistribution, SeatDistributionSkeleton } from './SeatDistribution';
import { TrendAnalysis, TrendAnalysisSkeleton } from './TrendAnalysis';
import { InteractiveFilters, InteractiveFiltersSkeleton } from './InteractiveFilters';
import { ElectionMap, ElectionMapSkeleton } from './ElectionMap';
import { ConstituencyRankings, ConstituencyRankingsSkeleton } from './ConstituencyRankings';

interface DashboardData {
  insights: Array<{
    id: string;
    type: 'insight' | 'trend' | 'warning' | 'success';
    message: string;
  }>;
  summary: Array<{
    title: string;
    value: string;
    change?: number;
    icon: string;
  }>;
  turnout: {
    constituency: Array<{ constituency: string; turnout: number; votes_cast: number; total_voters: number }>;
    regional: Array<{ region: string; turnout: number; votes_cast: number; total_voters: number }>;
    trend: Array<{ year: number; turnout: number }>;
  };
  voteShare: {
    overall: Array<{ party: string; votes: number; vote_share: number; seats_won: number }>;
    regional: Array<{ region: string; party: string; votes: number; vote_share: number }>;
  };
  seatDistribution: {
    partyData: Array<{ party: string; seats_won: number; seat_percentage: number; vote_share: number; swing: number }>;
    regionalData: Array<{ region: string; total_seats: number; party_distribution: Array<{ party: string; seats: number }> }>;
    majorityThreshold: number;
    leadingParty: { party: string; seats: number; percentage: number };
  };
  trend: {
    turnoutTrend: Array<{ year: number; turnout: number }>;
    partyTrends: Array<{ party: string; data: Array<{ year: number; vote_share?: number; seats_won?: number }> }>;
  };
  constituencies: Array<{
    id: string;
    name: string;
    state: string;
    winner: string;
    party: string;
    turnout: number;
    margin: number;
  }>;
  regions: Array<{
    name: string;
    winner: string;
    party: string;
    seats: number;
  }>;
  rankings: Array<{
    rank: number;
    constituency_id: string;
    constituency_name: string;
    state: string;
    total_votes: number;
    turnout: number;
    winner: { name: string; party: string; votes: number; vote_share: number };
    margin: number;
    margin_percentage: number;
    competitive_index: number;
  }>;
}

interface DashboardLayoutProps {
  data: DashboardData;
  isLoading?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ data, isLoading = false }) => {
  const [rankingCriteria, setRankingCriteria] = useState<'turnout' | 'margin' | 'competitive'>('turnout');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-6" />
          <AIInsightBannerSkeleton />
          <SummaryCardsSkeleton />
          <InteractiveFiltersSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TurnoutChartsSkeleton />
            <VoteShareChartsSkeleton />
          </div>
          <SeatDistributionSkeleton />
          <TrendAnalysisSkeleton />
          <ElectionMapSkeleton />
          <ConstituencyRankingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Election Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time insights and analysis</p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* AI Insight Banner */}
        <AIInsightBanner insights={data.insights} />

        {/* Summary Cards */}
        <SummaryCards metrics={data.summary} />

        {/* Interactive Filters */}
        <InteractiveFilters
          filterGroups={[
            {
              id: 'state',
              label: 'State',
              type: 'select',
              options: [
                { id: 'all', label: 'All States', value: 'all' },
                { id: 'up', label: 'Uttar Pradesh', value: 'UP' },
                { id: 'mh', label: 'Maharashtra', value: 'MH' },
                { id: 'tn', label: 'Tamil Nadu', value: 'TN' },
              ],
            },
            {
              id: 'party',
              label: 'Party',
              type: 'multiselect',
              options: [
                { id: 'bjp', label: 'BJP', value: 'BJP' },
                { id: 'inc', label: 'INC', value: 'INC' },
                { id: 'aap', label: 'AAP', value: 'AAP' },
                { id: 'tmc', label: 'TMC', value: 'TMC' },
              ],
            },
            {
              id: 'turnout',
              label: 'Turnout Range',
              type: 'range',
              min: 0,
              max: 100,
            },
          ]}
          onFilterChange={handleFilterChange}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TurnoutCharts
            constituencyData={data.turnout.constituency}
            regionalData={data.turnout.regional}
            trendData={data.turnout.trend}
          />
          <VoteShareCharts
            overallData={data.voteShare.overall}
            regionalData={data.voteShare.regional}
          />
        </div>

        {/* Seat Distribution */}
        <SeatDistribution
          partyData={data.seatDistribution.partyData}
          regionalData={data.seatDistribution.regionalData}
          majorityThreshold={data.seatDistribution.majorityThreshold}
          leadingParty={data.seatDistribution.leadingParty}
        />

        {/* Trend Analysis */}
        <TrendAnalysis
          turnoutTrend={data.trend.turnoutTrend}
          partyTrends={data.trend.partyTrends}
        />

        {/* Election Map */}
        <ElectionMap
          constituencies={data.constituencies}
          regions={data.regions}
          onConstituencyClick={(constituency) => console.log('Selected constituency:', constituency)}
        />

        {/* Constituency Rankings */}
        <ConstituencyRankings
          rankings={data.rankings}
          criteria={rankingCriteria}
          onCriteriaChange={setRankingCriteria}
        />
      </div>
    </div>
  );
};
