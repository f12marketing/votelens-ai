import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp } from 'lucide-react';

interface PartySeatData {
  party: string;
  seats_won: number;
  seat_percentage: number;
  vote_share: number;
  swing: number;
}

interface RegionalSeatData {
  region: string;
  total_seats: number;
  party_distribution: Array<{
    party: string;
    seats: number;
  }>;
}

interface SeatDistributionProps {
  partyData: PartySeatData[];
  regionalData: RegionalSeatData[];
  majorityThreshold: number;
  leadingParty: {
    party: string;
    seats: number;
    percentage: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const SeatDistribution: React.FC<SeatDistributionProps> = ({
  partyData,
  regionalData,
  majorityThreshold,
  leadingParty,
}) => {
  const hasMajority = leadingParty.seats >= majorityThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Seat Distribution
        </h2>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          hasMajority
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
        }`}>
          <Target className="w-4 h-4" />
          Majority: {majorityThreshold} seats
        </div>
      </div>

      {/* Leading Party Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${
          hasMajority
            ? 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
            : 'from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800'
        } border rounded-xl p-6`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${
            hasMajority
              ? 'bg-green-500'
              : 'bg-amber-500'
          }`}>
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {hasMajority ? 'Majority Winner' : 'Leading Party'}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {leadingParty.party}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Seats:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{leadingParty.seats}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Share:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{leadingParty.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          {hasMajority && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Majority</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                +{leadingParty.seats - majorityThreshold} over threshold
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Party Seat Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Seats Won by Party
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={partyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="party"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Seats', angle: -90, position: 'insideLeft' }}
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
            <Bar dataKey="seats_won" name="Seats Won" radius={[4, 4, 0, 0]}>
              {partyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Majority Threshold Line */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Majority Threshold</span>
            <span className="font-semibold text-gray-900 dark:text-white">{majorityThreshold} seats</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${(leadingParty.percentage / 100) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Regional Seat Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Seats by Region
        </h3>
        <div className="space-y-6">
          {regionalData.map((region) => {
            const totalSeats = region.party_distribution.reduce((sum, p) => sum + p.seats, 0);
            return (
              <div key={region.region} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">{region.region}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{totalSeats} seats</span>
                </div>
                <div className="space-y-2">
                  {region.party_distribution.map((party, index) => {
                    const percentage = (party.seats / totalSeats) * 100;
                    return (
                      <div key={party.party} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{party.party}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-700 dark:text-gray-300">{party.seats} seats</span>
                            <span className="text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Vote Share vs Seats Won Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Vote Share vs Seats Won
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Party
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Vote Share
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Seats Won
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Seat Share
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Swing
                </th>
                <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody>
              {partyData.map((party, index) => {
                const efficiency = party.vote_share > 0 ? (party.seat_percentage / party.vote_share) * 100 : 0;
                return (
                  <tr key={party.party} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-900 dark:text-white font-medium">{party.party}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                      {party.vote_share.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                      {party.seats_won}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                      {party.seat_percentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-medium ${
                        party.swing > 0
                          ? 'text-green-600 dark:text-green-400'
                          : party.swing < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {party.swing > 0 ? '+' : ''}{party.swing.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`font-medium ${
                        efficiency > 100
                          ? 'text-green-600 dark:text-green-400'
                          : efficiency < 80
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {efficiency.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

// Skeleton loader
export const SeatDistributionSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="h-80 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
};
