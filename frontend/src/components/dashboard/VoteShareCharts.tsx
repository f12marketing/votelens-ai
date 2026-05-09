import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

interface PartyVoteShare {
  party: string;
  votes: number;
  vote_share: number;
  seats_won: number;
}

interface RegionalVoteShare {
  region: string;
  party: string;
  votes: number;
  vote_share: number;
}

interface VoteShareChartsProps {
  overallData: PartyVoteShare[];
  regionalData: RegionalVoteShare[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const VoteShareCharts: React.FC<VoteShareChartsProps> = ({
  overallData,
  regionalData,
}) => {
  const [activeView, setActiveView] = useState<'pie' | 'bar'>('pie');

  // Group regional data by region
  const regionalGrouped = regionalData.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = [];
    }
    acc[item.region].push(item);
    return acc;
  }, {} as Record<string, RegionalVoteShare[]>);

  const regions = Object.keys(regionalGrouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Vote Share Analysis
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('pie')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setActiveView('bar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Overall Vote Share */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Overall Vote Share
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          {activeView === 'pie' ? (
            <PieChart>
              <Pie
                data={overallData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="vote_share"
              >
                {overallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={overallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="party"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Vote Share %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="vote_share" radius={[4, 4, 0, 0]}>
                {overallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>

        {/* Vote Share Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Party
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Votes
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Vote Share
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Seats Won
                </th>
              </tr>
            </thead>
            <tbody>
              {overallData.map((item, index) => (
                <tr key={item.party} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {item.party}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.votes.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.vote_share.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.seats_won}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Regional Vote Share */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Vote Share by Region
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regions.map((region, index) => (
            <div key={region} className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">{region}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionalGrouped[region]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="party"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="vote_share" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Skeleton loader
export const VoteShareChartsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex gap-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="h-80 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
};
