import React, { useMemo, useCallback } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

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
    seats?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface RegionOverlayProps {
  data: GeoJSONFeature[];
  onRegionClick?: (region: string) => void;
  visualizationMode: 'party' | 'turnout' | 'margin' | 'competitive';
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

const getColor = (feature: GeoJSONFeature, visualizationMode: string): string => {
  const props = feature.properties;
  
  switch (visualizationMode) {
    case 'party':
      return PARTY_COLORS[props.party || 'default'] || PARTY_COLORS.default;
    
    case 'turnout':
      if (!props.turnout) return '#6B7280';
      const turnoutIntensity = props.turnout / 100;
      return `rgba(59, 130, 246, ${0.3 + turnoutIntensity * 0.7})`;
    
    case 'margin':
      return '#6B7280';
    
    case 'competitive':
      return '#6B7280';
    
    default:
      return PARTY_COLORS.default;
  }
};

export const RegionOverlay: React.FC<RegionOverlayProps> = ({ 
  data, 
  onRegionClick, 
  visualizationMode 
}) => {
  const map = useMap();

  // Group constituencies by state/region
  const regionData = useMemo(() => {
    const regions = new Map<string, GeoJSONFeature[]>();
    
    data.forEach(feature => {
      const region = feature.properties.state;
      if (!regions.has(region)) {
        regions.set(region, []);
      }
      regions.get(region)!.push(feature);
    });
    
    return Array.from(regions.entries()).map(([region, features]) => {
      const totalSeats = features.reduce((sum, f) => sum + (f.properties.seats || 1), 0);
      const avgTurnout = features.reduce((sum, f) => sum + (f.properties.turnout || 0), 0) / features.length;
      
      // Determine dominant party
      const partyCount = new Map<string, number>();
      features.forEach(f => {
        const party = f.properties.party;
        if (party) {
          partyCount.set(party, (partyCount.get(party) || 0) + 1);
        }
      });
      
      const dominantParty = Array.from(partyCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      return {
        region,
        features,
        totalSeats,
        avgTurnout,
        dominantParty,
      };
    });
  }, [data]);

  const style = useCallback((region: typeof regionData[0]) => ({
    fillColor: getColor(region.features[0], visualizationMode),
    weight: 3,
    opacity: 1,
    color: '#fff',
    dashArray: '5',
    fillOpacity: 0.6,
  }), [visualizationMode]);

  const onEachRegion = useCallback((region: typeof regionData[0], layer: L.GeoJSON.Layer) => {
    layer.on({
      click: () => {
        onRegionClick?.(region.region);
        // Zoom to region bounds
        const bounds = L.latLngBounds(
          region.features.flatMap(f => {
            const coords = f.geometry.coordinates;
            if (f.geometry.type === 'Polygon') {
              return coords[0].map(c => [c[1], c[0]] as [number, number]);
            } else {
              return coords[0][0].map(c => [c[1], c[0]] as [number, number]);
            }
          })
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      },
      mouseover: (e) => {
        const target = e.target as L.GeoJSON.Layer;
        target.setStyle({ weight: 4, color: '#666' });
      },
      mouseout: (e) => {
        const target = e.target as L.GeoJSON.Layer;
        target.setStyle(style(region));
      },
    });
  }, [onRegionClick, map, style]);

  // Create simplified GeoJSON for regions (using centroid of all constituencies)
  const regionGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: regionData.map(region => {
        // Calculate centroid
        const allCoords = region.features.flatMap(f => {
          const coords = f.geometry.coordinates;
          if (f.geometry.type === 'Polygon') {
            return coords[0].map(c => [c[1], c[0]] as [number, number]);
          } else {
            return coords[0][0].map(c => [c[1], c[0]] as [number, number]);
          }
        });
        
        const avgLat = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length;
        const avgLng = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length;
        
        // Create a simple polygon around the centroid (simplified)
        const radius = 2; // degrees
        return {
          type: 'Feature' as const,
          properties: {
            id: region.region,
            name: region.region,
            state: region.region,
            party: region.dominantParty,
            turnout: region.avgTurnout,
            seats: region.totalSeats,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [avgLng - radius, avgLat - radius],
              [avgLng + radius, avgLat - radius],
              [avgLng + radius, avgLat + radius],
              [avgLng - radius, avgLat + radius],
              [avgLng - radius, avgLat - radius],
            ]],
          },
        };
      }),
    };
  }, [regionData]);

  return (
    <GeoJSON
      data={regionGeoJSON}
      style={(feature) => {
        const region = regionData.find(r => r.region === feature.properties.name);
        return region ? style(region) : {};
      }}
      onEachFeature={(feature, layer) => {
        const region = regionData.find(r => r.region === feature.properties.name);
        if (region) {
          onEachRegion(region, layer);
        }
      }}
    />
  );
};
