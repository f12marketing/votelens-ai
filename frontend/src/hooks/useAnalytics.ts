import { useState, useEffect } from 'react';
import { analyticsApi, TurnoutAnalysis, VoteShareAnalysis, SeatDistribution, ConstituencyRanking, SwingAnalysis, HistoricalComparison, CloseContestDetection, RegionalAnalysis } from '../lib/api/analytics';

// Generic hook for analytics data
function useAnalytics<T>(
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, refetchInterval]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for turnout analysis
export function useTurnoutAnalysis(electionId: string, enabled = true) {
  return useAnalytics<TurnoutAnalysis>(
    () => analyticsApi.getTurnoutAnalysis(electionId),
    { enabled }
  );
}

// Hook for vote share analysis
export function useVoteShareAnalysis(electionId: string, enabled = true) {
  return useAnalytics<VoteShareAnalysis>(
    () => analyticsApi.getVoteShareAnalysis(electionId),
    { enabled }
  );
}

// Hook for seat distribution
export function useSeatDistribution(electionId: string, enabled = true) {
  return useAnalytics<SeatDistribution>(
    () => analyticsApi.getSeatDistribution(electionId),
    { enabled }
  );
}

// Hook for constituency ranking
export function useConstituencyRanking(
  electionId: string,
  criteria: 'turnout' | 'margin' | 'competitive' = 'turnout',
  enabled = true
) {
  return useAnalytics<ConstituencyRanking>(
    () => analyticsApi.getConstituencyRanking(electionId, criteria),
    { enabled }
  );
}

// Hook for swing analysis
export function useSwingAnalysis(electionId: string, previousElectionId?: string, enabled = true) {
  return useAnalytics<SwingAnalysis>(
    () => analyticsApi.getSwingAnalysis(electionId, previousElectionId),
    { enabled }
  );
}

// Hook for historical comparison
export function useHistoricalComparison(electionId: string, compareWithYears?: number[], enabled = true) {
  return useAnalytics<HistoricalComparison>(
    () => analyticsApi.getHistoricalComparison(electionId, compareWithYears),
    { enabled }
  );
}

// Hook for close contests
export function useCloseContests(electionId: string, marginThreshold = 5, enabled = true) {
  return useAnalytics<CloseContestDetection>(
    () => analyticsApi.getCloseContests(electionId, marginThreshold),
    { enabled }
  );
}

// Hook for regional analysis
export function useRegionalAnalysis(electionId: string, enabled = true) {
  return useAnalytics<RegionalAnalysis>(
    () => analyticsApi.getRegionalAnalysis(electionId),
    { enabled }
  );
}

// Hook for combined analytics (fetches all at once)
export function useElectionAnalytics(electionId: string, enabled = true) {
  const turnout = useTurnoutAnalysis(electionId, enabled);
  const voteShare = useVoteShareAnalysis(electionId, enabled);
  const seatDistribution = useSeatDistribution(electionId, enabled);
  const constituencyRanking = useConstituencyRanking(electionId, 'turnout', enabled);
  const regionalAnalysis = useRegionalAnalysis(electionId, enabled);

  const loading = turnout.loading || voteShare.loading || seatDistribution.loading || constituencyRanking.loading || regionalAnalysis.loading;
  const error = turnout.error || voteShare.error || seatDistribution.error || constituencyRanking.error || regionalAnalysis.error;

  return {
    data: {
      turnout: turnout.data,
      voteShare: voteShare.data,
      seatDistribution: seatDistribution.data,
      constituencyRanking: constituencyRanking.data,
      regionalAnalysis: regionalAnalysis.data,
    },
    loading,
    error,
    refetch: () => {
      turnout.refetch();
      voteShare.refetch();
      seatDistribution.refetch();
      constituencyRanking.refetch();
      regionalAnalysis.refetch();
    },
  };
}
