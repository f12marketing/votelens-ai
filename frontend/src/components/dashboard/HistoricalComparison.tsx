import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, BarChart3, Filter, RefreshCw, Sparkles } from 'lucide-react';

interface Election {
  id: string;
  year: number;
  name: string;
}

interface ComparisonData {
  comparison: {
    year1: number;
    year2: number;
    voteShareChanges: Array<{
      party: string;
      year1Share: number;
      year2Share: number;
      change: number;
      trend: 'gaining' | 'losing' | 'stable';
    }>;
    turnoutShifts: Array<{
      constituencyName: string;
      state: string;
      year1Turnout: number;
      year2Turnout: number;
      change: number;
    }>;
    partyPerformanceChanges: Array<{
      party: string;
      year1Seats: number;
      year2Seats: number;
      seatsChange: number;
      performance: 'improving' | 'declining' | 'stable';
    }>;
    constituencySwings: Array<{
      constituencyName: string;
      state: string;
      year1Party: string;
      year2Party: string;
      swing: number;
      flipped: boolean;
    }>;
    summary: {
      overallTurnoutChange: number;
      totalFlippedConstituencies: number;
      biggestGainer: string;
      biggestLoser: string;
      averageSwing: number;
      keyInsights: string[];
    };
  };
  charts?: any[];
  aiSummary?: string;
}

export const HistoricalComparison: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection1, setSelectedElection1] = useState<string>('');
  const [selectedElection2, setSelectedElection2] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'parties' | 'turnout' | 'swings'>('overview');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const response = await fetch('/api/comparisons/elections');
      const data = await response.json();
      setElections(data.data.elections);
      if (data.data.elections.length >= 2) {
        setSelectedElection1(data.data.elections[0].id);
        setSelectedElection2(data.data.elections[1].id);
      }
    } catch (error) {
      console.error('Failed to fetch elections:', error);
    }
  };

  const handleCompare = async () => {
    if (!selectedElection1 || !selectedElection2) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/comparisons/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId1: selectedElection1,
          electionId2: selectedElection2,
          includeCharts,
          includeAI,
        }),
      });
      const data = await response.json();
      setComparisonData(data.data);
      setActiveTab('overview');
    } catch (error) {
      console.error('Failed to compare elections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const swapElections = () => {
    const temp = selectedElection1;
    setSelectedElection1(selectedElection2);
    setSelectedElection2(temp);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'gaining' || trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'losing' || trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'gaining' || trend === 'improving') return 'text-green-600';
    if (trend === 'losing' || trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Historical Election Comparison</h2>
          <p className="text-gray-600">Compare elections across years to analyze trends and shifts</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Election Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">First Election</label>
            <select
              value={selectedElection1}
              onChange={(e) => setSelectedElection1(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapElections}
            className="mt-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            title="Swap elections"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 rotate-180" />
          </button>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Second Election</label>
            <select
              value={selectedElection2}
              onChange={(e) => setSelectedElection2(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={!selectedElection1 || !selectedElection2 || isLoading}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Compare
              </>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include Charts</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include AI Summary</span>
            </label>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonData && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {['overview', 'parties', 'turnout', 'swings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Turnout Change</p>
                  <p className={`text-2xl font-bold ${
                    comparisonData.comparison.summary.overallTurnoutChange > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {comparisonData.comparison.summary.overallTurnoutChange > 0 ? '+' : ''}
                    {comparisonData.comparison.summary.overallTurnoutChange.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Flipped Seats</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {comparisonData.comparison.summary.totalFlippedConstituencies}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Average Swing</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {comparisonData.comparison.summary.averageSwing.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Biggest Gainer</p>
                  <p className="text-2xl font-bold text-green-600">
                    {comparisonData.comparison.summary.biggestGainer}
                  </p>
                </div>
              </div>

              {/* AI Summary */}
              {comparisonData.aiSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">AI Analysis Summary</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comparisonData.aiSummary}</p>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Key Insights</h3>
                <ul className="space-y-2">
                  {comparisonData.comparison.summary.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === 'parties' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Party Performance Changes</h3>
              <div className="space-y-4">
                {comparisonData.comparison.partyPerformanceChanges.map((party) => (
                  <div key={party.party} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(party.performance)}
                      <div>
                        <p className="font-medium text-gray-800">{party.party}</p>
                        <p className="text-sm text-gray-600">
                          Seats: {party.year1Seats} → {party.year2Seats} ({party.seatsChange > 0 ? '+' : ''}{party.seatsChange})
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getTrendColor(party.performance)}`}>
                      {party.seatsChange > 0 ? '+' : ''}{party.seatsChange}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Turnout Tab */}
          {activeTab === 'turnout' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Turnout Shifts by Constituency</h3>
              <div className="space-y-4">
                {comparisonData.comparison.turnoutShifts.map((shift) => (
                  <div key={shift.constituencyName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{shift.constituencyName}</p>
                      <p className="text-sm text-gray-600">{shift.state}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {shift.year1Turnout.toFixed(1)}% → {shift.year2Turnout.toFixed(1)}%
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        shift.change > 0 ? 'text-green-600' : shift.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {shift.change > 0 ? '+' : ''}{shift.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Swings Tab */}
          {activeTab === 'swings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Constituency Swings</h3>
              <div className="space-y-4">
                {comparisonData.comparison.constituencySwings.map((swing) => (
                  <div key={swing.constituencyName} className={`flex items-center justify-between p-4 rounded-lg ${swing.flipped ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium text-gray-800">{swing.constituencyName}</p>
                      <p className="text-sm text-gray-600">{swing.state}</p>
                      <p className="text-sm text-gray-600">
                        {swing.year1Party} → {swing.year2Party}
                        {swing.flipped && <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">FLIPPED</span>}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${swing.swing > 5 ? 'text-purple-600' : swing.swing > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                      {swing.swing.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          {comparisonData.charts && comparisonData.charts.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Visualizations</h3>
              <div className="grid grid-cols-2 gap-6">
                {comparisonData.charts.map((chart, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">{chart.title}</h4>
                    <div className="h-48 bg-white rounded flex items-center justify-center text-gray-400 text-sm">
                      Chart visualization would render here
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
