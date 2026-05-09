import React, { useState, useEffect } from 'react';
import { ElectionMapLeaflet, ElectionMapLeafletSkeleton } from './ElectionMapLeaflet';
import { createSampleGeoJSON, mergeElectionData, filterGeoJSON } from '../../utils/geojsonLoader';
import { InteractiveFilters } from './InteractiveFilters';

interface IntegratedElectionMapProps {
  electionId?: string;
  onConstituencySelect?: (constituencyId: string) => void;
}

export const IntegratedElectionMap: React.FC<IntegratedElectionMapProps> = ({
  electionId,
  onConstituencySelect,
}) => {
  const [viewMode, setViewMode] = useState<'constituency' | 'region' | 'heatmap'>('constituency');
  const [visualizationMode, setVisualizationMode] = useState<'party' | 'turnout' | 'margin' | 'competitive'>('party');
  const [geojsonData, setGeojsonData] = useState(createSampleGeoJSON());
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Simulate loading election data
  useEffect(() => {
    if (electionId) {
      setIsLoading(true);
      // In a real application, you would fetch data from your API
      setTimeout(() => {
        const sampleElectionData = {
          'const-001': {
            winner: 'Narendra Modi',
            party: 'BJP',
            turnout: 68.5,
            votes: 1250000,
            margin: 250000,
            competitive_index: 45,
          },
          'const-002': {
            winner: 'Narendra Modi',
            party: 'BJP',
            turnout: 62.3,
            votes: 980000,
            margin: 180000,
            competitive_index: 38,
          },
          'const-003': {
            winner: 'Gajanan Kirtikar',
            party: 'Shiv Sena',
            turnout: 55.2,
            votes: 850000,
            margin: 45000,
            competitive_index: 72,
          },
          'const-004': {
            winner: 'Dayanidhi Maran',
            party: 'DMK',
            turnout: 58.7,
            votes: 720000,
            margin: 120000,
            competitive_index: 55,
          },
          'const-005': {
            winner: 'Meenakshi Lekhi',
            party: 'BJP',
            turnout: 60.1,
            votes: 580000,
            margin: 95000,
            competitive_index: 48,
          },
        };

        const mergedData = mergeElectionData(createSampleGeoJSON(), sampleElectionData);
        setGeojsonData(mergedData);
        setIsLoading(false);
      }, 1000);
    }
  }, [electionId]);

  // Apply filters to GeoJSON data
  const filteredData = React.useMemo(() => {
    if (Object.keys(activeFilters).length === 0) {
      return geojsonData;
    }

    return filterGeoJSON(geojsonData, activeFilters);
  }, [geojsonData, activeFilters]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };

  const handleConstituencyClick = (constituency: any) => {
    onConstituencySelect?.(constituency.id);
    console.log('Constituency clicked:', constituency);
  };

  const handleRegionClick = (region: string) => {
    console.log('Region clicked:', region);
  };

  if (isLoading) {
    return <ElectionMapLeafletSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <InteractiveFilters
        filterGroups={[
          {
            id: 'state',
            label: 'State',
            type: 'select',
            options: [
              { id: 'all', label: 'All States', value: 'all' },
              { id: 'up', label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
              { id: 'mh', label: 'Maharashtra', value: 'Maharashtra' },
              { id: 'tn', label: 'Tamil Nadu', value: 'Tamil Nadu' },
              { id: 'dl', label: 'Delhi', value: 'Delhi' },
            ],
          },
          {
            id: 'party',
            label: 'Party',
            type: 'multiselect',
            options: [
              { id: 'bjp', label: 'BJP', value: 'BJP' },
              { id: 'inc', label: 'INC', value: 'INC' },
              { id: 'dmk', label: 'DMK', value: 'DMK' },
              { id: 'shivsena', label: 'Shiv Sena', value: 'Shiv Sena' },
              { id: 'aap', label: 'AAP', value: 'AAP' },
            ],
          },
          {
            id: 'turnout',
            label: 'Turnout Range',
            type: 'range',
            min: 0,
            max: 100,
          },
        ]}
        onFilterChange={handleFilterChange}
      />

      {/* Map Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              View Mode
            </label>
            <div className="flex gap-2">
              {(['constituency', 'region', 'heatmap'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Visualization
            </label>
            <div className="flex gap-2">
              {(['party', 'turnout', 'margin', 'competitive'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVisualizationMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    visualizationMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredData.features.length} constituencies
        </div>
      </div>

      {/* Map */}
      <div className="h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <ElectionMapLeaflet
          geojsonData={filteredData.features}
          viewMode={viewMode}
          visualizationMode={visualizationMode}
          onConstituencyClick={handleConstituencyClick}
          onRegionClick={handleRegionClick}
          filters={activeFilters}
        />
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Constituencies</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.features.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Turnout</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(filteredData.features.reduce((sum, f) => sum + (f.properties.turnout || 0), 0) / filteredData.features.length).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Votes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(filteredData.features.reduce((sum, f) => sum + (f.properties.votes || 0), 0) / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Competitive Seats</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredData.features.filter(f => (f.properties.competitive_index || 0) > 50).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegratedElectionMap;
