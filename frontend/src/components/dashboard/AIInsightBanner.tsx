import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Insight {
  id: string;
  type: 'insight' | 'trend' | 'warning' | 'success';
  title: string;
  description: string;
  confidence?: number;
}

interface AIInsightBannerProps {
  insights: Insight[];
  autoRotate?: boolean;
  interval?: number;
}

const iconMap = {
  insight: Sparkles,
  trend: TrendingUp,
  warning: AlertTriangle,
  success: CheckCircle,
};

const colorMap = {
  insight: 'bg-blue-500',
  trend: 'bg-green-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
};

const bgGradientMap = {
  insight: 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
  trend: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
  warning: 'from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950',
  success: 'from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
};

export const AIInsightBanner: React.FC<AIInsightBannerProps> = ({
  insights,
  autoRotate = true,
  interval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!autoRotate || insights.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, insights.length, interval]);

  if (insights.length === 0) {
    return null;
  }

  const currentInsight = insights[currentIndex];
  const Icon = iconMap[currentInsight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full bg-gradient-to-r ${bgGradientMap[currentInsight.type]} border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          key={currentIndex}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={`p-3 rounded-lg ${colorMap[currentInsight.type]} bg-opacity-20`}
        >
          <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
        </motion.div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentInsight.title}
                </h3>
                {currentInsight.confidence && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentInsight.confidence}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`h-full ${colorMap[currentInsight.type]}`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {currentInsight.confidence}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {currentInsight.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {insights.length > 1 && (
          <div className="flex gap-1">
            {insights.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? `${colorMap[currentInsight.type]} w-6`
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to insight ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Skeleton loader for AI insight banner
export const AIInsightBannerSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
