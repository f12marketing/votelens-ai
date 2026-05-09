import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

interface ConstituencyData {
  id: string;
  name: string;
  state: string;
  winner: string;
  party: string;
  turnout: number;
  margin: number;
}

interface RegionData {
  name: string;
  winner: string;
  party: string;
  seats: number;
}

interface ElectionMapProps {
  constituencies: ConstituencyData[];
  regions: RegionData[];
  onConstituencyClick?: (constituency: ConstituencyData) => void;
}

const PARTY_COLORS: Record<string, string> = {
  'BJP': '#FF9933',
  'INC': '#00BFFF',
  'AAP': '#006400',
  'TMC': '#004225',
  'DMK': '#FF0000',
  'AIADMK': '#009900',
  'SP': '#FF0000',
  'BSP': '#0000FF',
  'CPI': '#FF0000',
  'CPM': '#FF0000',
  'default': '#6B7280',
};

export const ElectionMap: React.FC<ElectionMapProps> = ({
  constituencies,
  regions,
  onConstituencyClick,
}) => {
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyData | null>(null);
  const [hoveredConstituency, setHoveredConstituency] = useState<ConstituencyData | null>(null);
  const [viewMode, setViewMode] = useState<'constituency' | 'region'>('constituency');

  const getPartyColor = (party: string) => PARTY_COLORS[party] || PARTY_COLORS.default;

  const handleConstituencyClick = (constituency: ConstituencyData) => {
    setSelectedConstituency(constituency);
    onConstituencyClick?.(constituency);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Election Map
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('constituency')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'constituency'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Constituency
          </button>
          <button
            onClick={() => setViewMode('region')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'region'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Region
          </button>
        </div>
      </div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
      >
        {/* Map Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {viewMode === 'constituency'
                ? `${constituencies.length} constituencies`
                : `${regions.length} regions`}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="relative h-96 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
          {viewMode === 'constituency' ? (
            <div className="absolute inset-0 p-4">
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-1 h-full">
                {constituencies.map((constituency) => (
                  <motion.div
                    key={constituency.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleConstituencyClick(constituency)}
                    onMouseEnter={() => setHoveredConstituency(constituency)}
                    onMouseLeave={() => setHoveredConstituency(null)}
                    className="relative rounded-sm cursor-pointer group"
                    style={{
                      backgroundColor: getPartyColor(constituency.party),
                      opacity: selectedConstituency?.id === constituency.id ? 1 : 0.8,
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
                {regions.map((region) => (
                  <motion.div
                    key={region.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-lg cursor-pointer group relative overflow-hidden"
                    style={{ backgroundColor: getPartyColor(region.party) }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-20" />
                    <div className="relative p-4 text-white">
                      <h4 className="font-semibold text-lg">{region.name}</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm opacity-90">Winner: {region.winner}</p>
                        <p className="text-sm opacity-90">Party: {region.party}</p>
                        <p className="text-sm opacity-90">Seats: {region.seats}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tooltip */}
          {hoveredConstituency && viewMode === 'constituency' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-10 max-w-xs"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full mt-1"
                  style={{ backgroundColor: getPartyColor(hoveredConstituency.party) }}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {hoveredConstituency.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{hoveredConstituency.state}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Winner: {hoveredConstituency.winner}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Party: {hoveredConstituency.party}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Turnout: {hoveredConstituency.turnout.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Margin: {hoveredConstituency.margin.toLocaleString()} votes
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Party Legend</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(PARTY_COLORS).slice(0, 8).map(([party, color]) => (
              <div key={party} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{party}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Others</span>
            </div>
          </div>
        </div>

        {/* Selected Constituency Details */}
        {selectedConstituency && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedConstituency.name}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedConstituency.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Winner</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedConstituency.winner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Party</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedConstituency.party}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Turnout</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedConstituency.turnout.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Margin</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedConstituency.margin.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedConstituency(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Skeleton loader
export const ElectionMapSkeleton: React.FC = () => {
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="mt-4 h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
};
