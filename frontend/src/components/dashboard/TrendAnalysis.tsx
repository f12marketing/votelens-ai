import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TrendData {
  year: number;
  turnout?: number;
  party?: string;
  vote_share?: number;
  seats_won?: number;
}

interface PartyTrendData {
  party: string;
  data: TrendData[];
}

interface TrendAnalysisProps {
  turnoutTrend: TrendData[];
  partyTrends: PartyTrendData[];
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  turnoutTrend,
  partyTrends,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'turnout' | 'vote_share' | 'seats'>('vote_share');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  const metrics = [
    { id: 'turnout' as const, label: 'Turnout %' },
    { id: 'vote_share' as const, label: 'Vote Share %' },
    { id: 'seats' as const, label: 'Seats Won' },
  ];

  const getTrendDirection = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const getTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Trend Analysis
        </h2>
        <div className="flex gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metric.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Turnout Trend */}
      {selectedMetric === 'turnout' && (
        <motion.div
          key="turnout"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Historical Turnout Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={turnoutTrend}>
              <defs>
                <linearGradient id="colorTurnout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Turnout %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="turnout"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTurnout)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Trend Summary */}
          {turnoutTrend.length >= 2 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {turnoutTrend.slice(-2).map((data, index) => {
                const isLatest = index === turnoutTrend.length - 2;
                const previous = turnoutTrend[turnoutTrend.length - 3 - index];
                const direction = previous ? getTrendDirection(data.turnout || 0, previous.turnout || 0) : 'neutral';
                const percentage = previous ? getTrendPercentage(data.turnout || 0, previous.turnout || 0) : 0;

                return (
                  <div
                    key={data.year}
                    className={`p-4 rounded-lg ${
                      isLatest
                        ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{data.year}</span>
                      {direction !== 'neutral' && (
                        <div
                          className={`flex items-center gap-1 ${
                            direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {direction === 'up' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">{Math.abs(percentage).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.turnout?.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Party Trends */}
      {selectedMetric !== 'turnout' && (
        <motion.div
          key={selectedMetric}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Party Selection */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedParty(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedParty === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Parties
            </button>
            {partyTrends.map((partyTrend) => (
              <button
                key={partyTrend.party}
                onClick={() => setSelectedParty(partyTrend.party)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedParty === partyTrend.party
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {partyTrend.party}
              </button>
            ))}
          </div>

          {/* Trend Charts */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              {selectedParty ? `${selectedParty} Trend` : 'Party Comparison'}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={selectedParty ? partyTrends.find(p => p.party === selectedParty)?.data : partyTrends[0]?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{
                    value: selectedMetric === 'seats' ? 'Seats' : 'Percentage',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                {!selectedParty ? (
                  partyTrends.map((partyTrend, index) => (
                    <Line
                      key={partyTrend.party}
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={`#${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]}`}
                      strokeWidth={2}
                      name={partyTrend.party}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name={selectedMetric === 'seats' ? 'Seats Won' : selectedMetric === 'vote_share' ? 'Vote Share' : 'Value'}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>

            {/* Party Performance Summary */}
            <div className="mt-6 space-y-4">
              {partyTrends.map((partyTrend) => {
                const latestData = partyTrend.data[partyTrend.data.length - 1];
                const previousData = partyTrend.data[partyTrend.data.length - 2];
                const direction = previousData
                  ? getTrendDirection(latestData[selectedMetric as keyof TrendData] as number, previousData[selectedMetric as keyof TrendData] as number)
                  : 'neutral';
                const percentage = previousData
                  ? getTrendPercentage(latestData[selectedMetric as keyof TrendData] as number, previousData[selectedMetric as keyof TrendData] as number)
                  : 0;

                return (
                  <div
                    key={partyTrend.party}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `#${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][partyTrends.indexOf(partyTrend) % 6]}` }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{partyTrend.party}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Latest</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedMetric === 'seats'
                            ? latestData.seats_won
                            : selectedMetric === 'vote_share'
                            ? `${latestData.vote_share?.toFixed(1)}%`
                            : '-'}
                        </p>
                      </div>
                      {direction !== 'neutral' && (
                        <div
                          className={`flex items-center gap-1 ${
                            direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {direction === 'up' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">{Math.abs(percentage).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Skeleton loader
export const TrendAnalysisSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="h-80 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};
