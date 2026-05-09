import React, { useMemo } from 'react';
import { CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    state: string;
    turnout?: number;
    votes?: number;
    margin?: number;
    competitive_index?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface HeatmapLayerProps {
  data: GeoJSONFeature[];
  visualizationMode: 'party' | 'turnout' | 'margin' | 'competitive';
}

const getColor = (value: number, mode: 'turnout' | 'margin' | 'competitive'): string => {
  const normalized = Math.min(value / 100, 1);
  
  switch (mode) {
    case 'turnout':
      return `rgba(59, 130, 246, ${0.3 + normalized * 0.7})`;
    case 'margin':
      return `rgba(239, 68, 68, ${0.3 + normalized * 0.7})`;
    case 'competitive':
      return `rgba(16, 185, 129, ${0.3 + normalized * 0.7})`;
    default:
      return 'rgba(107, 114, 128, 0.5)';
  }
};

const getRadius = (value: number, mode: 'turnout' | 'margin' | 'competitive'): number => {
  const normalized = Math.min(value / 100, 1);
  return 10 + normalized * 30;
};

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data, visualizationMode }) => {
  const map = useMap();

  const heatmapData = useMemo(() => {
    if (visualizationMode === 'party') return [];
    
    return data
      .filter(feature => {
        const value = visualizationMode === 'turnout' 
          ? feature.properties.turnout 
          : visualizationMode === 'margin' 
          ? feature.properties.margin 
          : feature.properties.competitive_index;
        return value !== undefined && value > 0;
      })
      .map(feature => {
        const value = visualizationMode === 'turnout' 
          ? feature.properties.turnout || 0
          : visualizationMode === 'margin' 
          ? (feature.properties.margin || 0) / 1000
          : feature.properties.competitive_index || 0;
        
        const [lng, lat] = feature.geometry.coordinates;
        
        return {
          id: feature.properties.id,
          position: [lat, lng] as [number, number],
          value,
          properties: feature.properties,
          color: getColor(value, visualizationMode),
          radius: getRadius(value, visualizationMode),
        };
      });
  }, [data, visualizationMode]);

  if (visualizationMode === 'party' || heatmapData.length === 0) {
    return null;
  }

  return (
    <>
      {heatmapData.map(point => (
        <CircleMarker
          key={point.id}
          center={point.position}
          radius={point.radius}
          pathOptions={{
            color: point.color,
            fillColor: point.color,
            fillOpacity: 0.6,
            weight: 0,
          }}
          eventHandlers={{
            mouseover: (e) => {
              const target = e.target as L.CircleMarker;
              target.setStyle({ fillOpacity: 0.8, weight: 2, color: '#fff' });
            },
            mouseout: (e) => {
              const target = e.target as L.CircleMarker;
              target.setStyle({ fillOpacity: 0.6, weight: 0, color: point.color });
            },
          }}
        />
      ))}
    </>
  );
};
