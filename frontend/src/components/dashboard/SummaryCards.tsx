import React from 'react';
import { motion } from 'framer-motion';
import { Users, Vote, TrendingUp, MapPin, BarChart3, Award } from 'lucide-react';

interface SummaryCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

const iconColorMap = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  pink: 'text-pink-600 dark:text-pink-400',
  teal: 'text-teal-600 dark:text-teal-400',
};

const bgColorMap = {
  blue: 'bg-blue-50 dark:bg-blue-950',
  green: 'bg-green-50 dark:bg-green-950',
  purple: 'bg-purple-50 dark:bg-purple-950',
  orange: 'bg-orange-50 dark:bg-orange-950',
  pink: 'bg-pink-50 dark:bg-pink-950',
  teal: 'bg-teal-50 dark:bg-teal-950',
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${bgColorMap[card.color as keyof typeof bgColorMap]}`}>
                <Icon className={`w-5 h-5 ${iconColorMap[card.color as keyof typeof iconColorMap]}`} />
              </div>
              {card.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    card.changeType === 'increase'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {card.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  )}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {card.title}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Skeleton loader
export const SummaryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-16 h-5 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};
