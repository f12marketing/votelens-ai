import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Award, Medal, ArrowUpDown } from 'lucide-react';

interface ConstituencyRankingData {
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
}

interface ConstituencyRankingsProps {
  rankings: ConstituencyRankingData[];
  criteria: 'turnout' | 'margin' | 'competitive';
  onCriteriaChange: (criteria: 'turnout' | 'margin' | 'competitive') => void;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">{rank}</span>;
};

const getCriteriaLabel = (criteria: 'turnout' | 'margin' | 'competitive') => {
  switch (criteria) {
    case 'turnout':
      return 'Turnout %';
    case 'margin':
      return 'Margin %';
    case 'competitive':
      return 'Competitive Index';
  }
};

const getCriteriaValue = (item: ConstituencyRankingData, criteria: 'turnout' | 'margin' | 'competitive') => {
  switch (criteria) {
    case 'turnout':
      return item.turnout.toFixed(1);
    case 'margin':
      return item.margin_percentage.toFixed(1);
    case 'competitive':
      return item.competitive_index.toFixed(1);
  }
};

export const ConstituencyRankings: React.FC<ConstituencyRankingsProps> = ({
  rankings,
  criteria,
  onCriteriaChange,
}) => {
  const [sortBy, setSortBy] = useState<'rank' | 'constituency' | 'value'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedRankings = [...rankings].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'rank') {
      comparison = a.rank - b.rank;
    } else if (sortBy === 'constituency') {
      comparison = a.constituency_name.localeCompare(b.constituency_name);
    } else if (sortBy === 'value') {
      const aValue = criteria === 'turnout' ? a.turnout : criteria === 'margin' ? a.margin_percentage : a.competitive_index;
      const bValue = criteria === 'turnout' ? b.turnout : criteria === 'margin' ? b.margin_percentage : b.competitive_index;
      comparison = aValue - bValue;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'rank' | 'constituency' | 'value') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Constituency Rankings
        </h2>
        <div className="flex gap-2">
          {(['turnout', 'margin', 'competitive'] as const).map((c) => (
            <button
              key={c}
              onClick={() => onCriteriaChange(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                criteria === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {c === 'turnout' ? 'Turnout' : c === 'margin' ? 'Margin' : 'Competitive'}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div className="col-span-1">Rank</div>
          <div 
            className="col-span-4 cursor-pointer hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            onClick={() => handleSort('constituency')}
          >
            Constituency
            {sortBy === 'constituency' && <ArrowUpDown className="w-4 h-4" />}
          </div>
          <div className="col-span-2">State</div>
          <div className="col-span-2">Winner</div>
          <div 
            className="col-span-2 cursor-pointer hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            onClick={() => handleSort('value')}
          >
            {getCriteriaLabel(criteria)}
            {sortBy === 'value' && <ArrowUpDown className="w-4 h-4" />}
          </div>
          <div className="col-span-1">Party</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedRankings.slice(0, 20).map((item, index) => (
            <motion.div
              key={item.constituency_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors items-center"
            >
              <div className="col-span-1 flex items-center justify-center">
                {getRankIcon(item.rank)}
              </div>
              <div className="col-span-4">
                <p className="font-medium text-gray-900 dark:text-white">{item.constituency_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.total_votes.toLocaleString()} votes</p>
              </div>
              <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">{item.state}</div>
              <div className="col-span-2">
                <p className="font-medium text-gray-900 dark:text-white">{item.winner.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.winner.vote_share.toFixed(1)}%</p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${criteria === 'turnout' ? item.turnout : criteria === 'margin' ? item.margin_percentage : item.competitive_index}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                    {getCriteriaValue(item, criteria)}%
                  </span>
                </div>
              </div>
              <div className="col-span-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.winner.party === 'BJP' ? '#FF9933' :
                                   item.winner.party === 'INC' ? '#00BFFF' :
                                   item.winner.party === 'AAP' ? '#006400' :
                                   item.winner.party === 'TMC' ? '#004225' :
                                   '#6B7280'
                  }}
                  title={item.winner.party}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show More */}
        {rankings.length > 20 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
              Show all {rankings.length} constituencies
            </button>
          </div>
        )}
      </motion.div>

      {/* Top 3 Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankings.slice(0, 3).map((item, index) => (
          <motion.div
            key={item.constituency_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${
              index === 0
                ? 'from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800'
                : index === 1
                ? 'from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border-gray-200 dark:border-gray-700'
                : 'from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800'
            } border rounded-xl p-4`}
          >
            <div className="flex items-center gap-3 mb-3">
              {getRankIcon(item.rank)}
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">#{item.rank} Ranked</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.constituency_name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{getCriteriaLabel(criteria)}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{getCriteriaValue(item, criteria)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Winner</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.winner.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Party</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.winner.party}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Skeleton loader
export const ConstituencyRankingsSkeleton: React.FC = () => {
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
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-200 dark:bg-gray-700">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          ))}
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
};
