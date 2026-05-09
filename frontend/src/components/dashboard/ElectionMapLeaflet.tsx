import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import { ZoomIn, ZoomOut, Maximize2, Layers, MapPin, Info } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Lazy load heavy components
const HeatmapLayer = lazy(() => import('./map/HeatmapLayer'));
const RegionOverlay = lazy(() => import('./map/RegionOverlay'));

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libsleaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    state: string;
    winner?: string;
    party?: string;
    turnout?: number;
    votes?: number;
    margin?: number;
    competitive_index?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface ElectionMapLeafletProps {
  geojsonData: GeoJSONFeature[];
  viewMode: 'constituency' | 'region' | 'heatmap';
  visualizationMode: 'party' | 'turnout' | 'margin' | 'competitive';
  onConstituencyClick?: (constituency: GeoJSONFeature['properties']) => void;
  onRegionClick?: (region: string) => void;
  filters?: {
    state?: string;
    party?: string[];
    turnoutRange?: [number, number];
  };
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

// Custom zoom control component
const CustomZoomControl: React.FC<{ map: L.Map }> = ({ map }) => {
  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleReset = () => map.setView([20.5937, 78.9629], 5);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-2">
      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
      <button
        onClick={handleReset}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors border-t border-gray-200 dark:border-gray-700"
        title="Reset View"
      >
        <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
    </div>
  );
};

// Map controller component for programmatic control
const MapController: React.FC<{
  viewMode: 'constituency' | 'region' | 'heatmap';
  filters?: ElectionMapLeafletProps['filters'];
}> = ({ viewMode, filters }) => {
  const map = useMap();

  useEffect(() => {
    if (filters?.state) {
      // Zoom to specific state (simplified - would need state boundaries)
      map.setZoom(7);
    }
  }, [filters, map]);

  return null;
};

// Tooltip component
const MapTooltip: React.FC<{
  feature: GeoJSONFeature['properties'] | null;
  position: L.LatLngExpression | null;
}> = ({ feature, position }) => {
  if (!feature || !position) return null;

  return (
    <div
      className="absolute z-[2000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-xl max-w-xs pointer-events-none"
      style={{
        transform: 'translate(-50%, -100%)',
        left: (position as L.LatLng).lng,
        top: (position as L.LatLng).lat,
        marginTop: '-10px',
      }}
    >
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{feature.state}</p>
      <div className="space-y-1">
        {feature.winner && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Winner: {feature.winner}
          </p>
        )}
        {feature.party && (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PARTY_COLORS[feature.party] || PARTY_COLORS.default }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{feature.party}</span>
          </div>
        )}
        {feature.turnout && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Turnout: {feature.turnout.toFixed(1)}%
          </p>
        )}
        {feature.margin && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Margin: {feature.margin.toLocaleString()} votes
          </p>
        )}
      </div>
    </div>
  );
};

// Constituency layer component
const ConstituencyLayer: React.FC<{
  data: GeoJSONFeature[];
  visualizationMode: ElectionMapLeafletProps['visualizationMode'];
  onFeatureClick: (feature: GeoJSONFeature) => void;
  onFeatureHover: (feature: GeoJSONFeature['properties'] | null, latlng: L.LatLng | null) => void;
}> = ({ data, visualizationMode, onFeatureClick, onFeatureHover }) => {
  const getColor = useCallback((feature: GeoJSONFeature) => {
    const props = feature.properties;
    
    switch (visualizationMode) {
      case 'party':
        return PARTY_COLORS[props.party || 'default'] || PARTY_COLORS.default;
      
      case 'turnout':
        if (!props.turnout) return '#6B7280';
        const turnoutIntensity = props.turnout / 100;
        return `rgba(59, 130, 246, ${0.3 + turnoutIntensity * 0.7})`;
      
      case 'margin':
        if (!props.margin) return '#6B7280';
        const marginIntensity = Math.min(props.margin / 100000, 1);
        return `rgba(239, 68, 68, ${0.3 + marginIntensity * 0.7})`;
      
      case 'competitive':
        if (!props.competitive_index) return '#6B7280';
        const competitiveIntensity = props.competitive_index / 100;
        return `rgba(16, 185, 129, ${0.3 + competitiveIntensity * 0.7})`;
      
      default:
        return PARTY_COLORS.default;
    }
  }, [visualizationMode]);

  const style = useCallback((feature: GeoJSONFeature) => ({
    fillColor: getColor(feature),
    weight: 2,
    opacity: 1,
    color: '#fff',
    dashArray: '3',
    fillOpacity: 0.7,
  }), [getColor]);

  const onEachFeature = useCallback((feature: GeoJSONFeature, layer: L.GeoJSON.Layer) => {
    layer.on({
      click: () => onFeatureClick(feature),
      mouseover: (e) => {
        layer.setStyle({ weight: 3, color: '#666' });
        onFeatureHover(feature.properties, e.latlng);
      },
      mouseout: () => {
        layer.setStyle(style(feature));
        onFeatureHover(null, null);
      },
    });
  }, [onFeatureClick, onFeatureHover, style]);

  return (
    <GeoJSON
      data={{ type: 'FeatureCollection', features: data }}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
};

export const ElectionMapLeaflet: React.FC<ElectionMapLeafletProps> = ({
  geojsonData,
  viewMode,
  visualizationMode,
  onConstituencyClick,
  onRegionClick,
  filters,
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<GeoJSONFeature['properties'] | null>(null);
  const [hoverPosition, setHoverPosition] = useState<L.LatLng | null>(null);
  const [selectedConstituency, setSelectedConstituency] = useState<GeoJSONFeature['properties'] | null>(null);
  const mapRef = useRef<L.Map>(null);

  const handleFeatureClick = useCallback((feature: GeoJSONFeature) => {
    setSelectedConstituency(feature.properties);
    onConstituencyClick?.(feature.properties);
  }, [onConstituencyClick]);

  const handleFeatureHover = useCallback((feature: GeoJSONFeature['properties'] | null, latlng: L.LatLng | null) => {
    setHoveredFeature(feature);
    setHoverPosition(latlng);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);

  const filteredData = React.useMemo(() => {
    if (!filters) return geojsonData;
    
    return geojsonData.filter(feature => {
      if (filters.state && feature.properties.state !== filters.state) return false;
      if (filters.party && filters.party.length > 0 && !filters.party.includes(feature.properties.party || '')) return false;
      if (filters.turnoutRange) {
        const turnout = feature.properties.turnout || 0;
        if (turnout < filters.turnoutRange[0] || turnout > filters.turnoutRange[1]) return false;
      }
      return true;
    });
  }, [geojsonData, filters]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="rounded-lg"
        whenReady={({ target }) => handleMapReady(target)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="topright" />
        
        <MapController viewMode={viewMode} filters={filters} />
        
        {mapInstance && <CustomZoomControl map={mapInstance} />}
        
        {viewMode === 'constituency' && (
          <ConstituencyLayer
            data={filteredData}
            visualizationMode={visualizationMode}
            onFeatureClick={handleFeatureClick}
            onFeatureHover={handleFeatureHover}
          />
        )}
        
        {viewMode === 'heatmap' && (
          <Suspense fallback={null}>
            <HeatmapLayer data={filteredData} visualizationMode={visualizationMode} />
          </Suspense>
        )}
        
        {viewMode === 'region' && (
          <Suspense fallback={null}>
            <RegionOverlay
              data={filteredData}
              onRegionClick={onRegionClick}
              visualizationMode={visualizationMode}
            />
          </Suspense>
        )}
      </MapContainer>

      {/* Tooltip */}
      <MapTooltip feature={hoveredFeature} position={hoverPosition as L.LatLngExpression | null} />

      {/* Selected Constituency Panel */}
      {selectedConstituency && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-4 max-w-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{selectedConstituency.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedConstituency.state}</p>
            </div>
            <button
              onClick={() => setSelectedConstituency(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-2">
            {selectedConstituency.winner && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Winner</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedConstituency.winner}</span>
              </div>
            )}
            {selectedConstituency.party && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Party</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedConstituency.party}</span>
              </div>
            )}
            {selectedConstituency.turnout && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Turnout</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedConstituency.turnout.toFixed(1)}%</span>
              </div>
            )}
            {selectedConstituency.margin && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Margin</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedConstituency.margin.toLocaleString()}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Legend</h4>
        {visualizationMode === 'party' && (
          <div className="space-y-1">
            {Object.entries(PARTY_COLORS).slice(0, 6).map(([party, color]) => (
              <div key={party} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{party}</span>
              </div>
            ))}
          </div>
        )}
        {visualizationMode === 'turnout' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-200" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Low (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Medium (50-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-700" />
              <span className="text-xs text-gray-600 dark:text-gray-400">High (&gt;70%)</span>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-1 flex gap-1">
        {(['constituency', 'region', 'heatmap'] as const).map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

// Skeleton loader
export const ElectionMapLeafletSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
      <div className="absolute top-4 right-4 w-12 h-32 bg-gray-300 dark:bg-gray-700 rounded-lg" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
      <div className="absolute bottom-4 right-4 w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />
    </div>
  );
};
