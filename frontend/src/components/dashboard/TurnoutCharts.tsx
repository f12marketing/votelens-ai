import React, { useState } from 'react';
import {
  BarChart,
  Bar,
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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TurnoutData {
  constituency: string;
  turnout: number;
  votes_cast: number;
  total_voters: number;
}

interface RegionalTurnoutData {
  region: string;
  turnout: number;
  votes_cast: number;
  total_voters: number;
}

interface TrendData {
  year: number;
  turnout: number;
}

interface TurnoutChartsProps {
  constituencyData: TurnoutData[];
  regionalData: RegionalTurnoutData[];
  trendData: TrendData[];
}

export const TurnoutCharts: React.FC<TurnoutChartsProps> = ({
  constituencyData,
  regionalData,
  trendData,
}) => {
  const [activeTab, setActiveTab] = useState<'constituency' | 'regional' | 'trend'>('constituency');

  const tabs = [
    { id: 'constituency' as const, label: 'By Constituency' },
    { id: 'regional' as const, label: 'By Region' },
    { id: 'trend' as const, label: 'Historical Trend' },
  ];

  const calculateAverageTurnout = (data: TurnoutData[] | RegionalTurnoutData[]) => {
    return data.reduce((sum, item) => sum + item.turnout, 0) / data.length;
  };

  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Turnout Analysis
        </h2>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        {activeTab === 'constituency' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Top 10 Constituencies by Turnout
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Average:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {calculateAverageTurnout(constituencyData).toFixed(1)}%
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={constituencyData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="constituency"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
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
                <Bar dataKey="turnout" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'regional' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Turnout by Region
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Turnout %', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="turnout" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Historical Turnout Trend
              </h3>
              {trendData.length >= 2 && (
                <div className="flex items-center gap-2">
                  {getTrendIcon(trendData[trendData.length - 1].turnout, trendData[trendData.length - 2].turnout)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trendData[trendData.length - 1].year} vs {trendData[trendData.length - 2].year}
                  </span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTurnout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
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
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorTurnout)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Skeleton loader
export const TurnoutChartsSkeleton: React.FC = () => {
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
        <div className="h-80 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
};
