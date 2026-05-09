/**
 * GeoJSON Loader Utility
 * Handles loading, parsing, and processing GeoJSON data for election maps
 */

export interface GeoJSONFeature {
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
    seats?: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'Point';
    coordinates: number[][][] | number[][][][] | [number, number];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Load GeoJSON from a URL
 */
export async function loadGeoJSON(url: string): Promise<GeoJSONCollection> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    const data = await response.json();
    return validateGeoJSON(data);
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    throw error;
  }
}

/**
 * Load GeoJSON from a file (for development/testing)
 */
export async function loadGeoJSONFromFile(file: File): Promise<GeoJSONCollection> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateGeoJSON(data);
  } catch (error) {
    console.error('Error loading GeoJSON from file:', error);
    throw error;
  }
}

/**
 * Validate GeoJSON structure
 */
export function validateGeoJSON(data: any): GeoJSONCollection {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid GeoJSON: not an object');
  }

  if (data.type !== 'FeatureCollection') {
    throw new Error('Invalid GeoJSON: must be a FeatureCollection');
  }

  if (!Array.isArray(data.features)) {
    throw new Error('Invalid GeoJSON: features must be an array');
  }

  return data as GeoJSONCollection;
}

/**
 * Merge election data with GeoJSON features
 */
export function mergeElectionData(
  geojson: GeoJSONCollection,
  electionData: Record<string, any>,
  matchProperty: string = 'id'
): GeoJSONCollection {
  return {
    ...geojson,
    features: geojson.features.map(feature => {
      const matchId = feature.properties[matchProperty];
      const electionInfo = electionData[matchId] || {};
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...electionInfo,
        },
      };
    }),
  };
}

/**
 * Filter GeoJSON features by properties
 */
export function filterGeoJSON(
  geojson: GeoJSONCollection,
  filters: Record<string, any>
): GeoJSONCollection {
  return {
    ...geojson,
    features: geojson.features.filter(feature => {
      return Object.entries(filters).every(([key, value]) => {
        const featureValue = feature.properties[key];
        
        if (Array.isArray(value)) {
          return value.includes(featureValue);
        }
        
        if (typeof value === 'object' && value !== null) {
          // Range filter
          if (value.min !== undefined && value.max !== undefined) {
            return featureValue >= value.min && featureValue <= value.max;
          }
        }
        
        return featureValue === value;
      });
    }),
  };
}

/**
 * Calculate centroid of a GeoJSON feature
 */
export function calculateCentroid(feature: GeoJSONFeature): [number, number] {
  const coords = feature.geometry.coordinates;
  
  if (feature.geometry.type === 'Point') {
    return coords as [number, number];
  }
  
  if (feature.geometry.type === 'Polygon') {
    const polygon = coords as number[][][];
    let sumX = 0;
    let sumY = 0;
    let totalPoints = 0;
    
    polygon[0].forEach(coord => {
      sumX += coord[0];
      sumY += coord[1];
      totalPoints++;
    });
    
    return [sumX / totalPoints, sumY / totalPoints];
  }
  
  if (feature.geometry.type === 'MultiPolygon') {
    const polygons = coords as number[][][][];
    let sumX = 0;
    let sumY = 0;
    let totalPoints = 0;
    
    polygons.forEach(polygon => {
      polygon[0].forEach(coord => {
        sumX += coord[0];
        sumY += coord[1];
        totalPoints++;
      });
    });
    
    return [sumX / totalPoints, sumY / totalPoints];
  }
  
  return [0, 0];
}

/**
 * Convert GeoJSON to Point features for heatmap
 */
export function convertToPoints(geojson: GeoJSONCollection): GeoJSONCollection {
  return {
    type: 'FeatureCollection',
    features: geojson.features.map(feature => {
      const centroid = calculateCentroid(feature);
      
      return {
        type: 'Feature',
        properties: feature.properties,
        geometry: {
          type: 'Point',
          coordinates: centroid,
        },
      };
    }),
  };
}

/**
 * Simplify GeoJSON geometry (reduce precision for performance)
 */
export function simplifyGeoJSON(
  geojson: GeoJSONCollection,
  precision: number = 6
): GeoJSONCollection {
  const roundCoordinate = (coord: number): number => {
    return Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision);
  };

  const processCoordinates = (coords: any): any => {
    if (Array.isArray(coords)) {
      return coords.map(processCoordinates);
    }
    if (typeof coords === 'number') {
      return roundCoordinate(coords);
    }
    return coords;
  };

  return {
    ...geojson,
    features: geojson.features.map(feature => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: processCoordinates(feature.geometry.coordinates),
      },
    })),
  };
}

/**
 * Create sample GeoJSON for testing
 */
export function createSampleGeoJSON(): GeoJSONCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'const-001',
          name: 'Lucknow',
          state: 'Uttar Pradesh',
          winner: 'Narendra Modi',
          party: 'BJP',
          turnout: 68.5,
          votes: 1250000,
          margin: 250000,
          competitive_index: 45,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [80.9, 26.8],
              [81.0, 26.8],
              [81.0, 26.9],
              [80.9, 26.9],
              [80.9, 26.8],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: 'const-002',
          name: 'Varanasi',
          state: 'Uttar Pradesh',
          winner: 'Narendra Modi',
          party: 'BJP',
          turnout: 62.3,
          votes: 980000,
          margin: 180000,
          competitive_index: 38,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [82.9, 25.2],
              [83.0, 25.2],
              [83.0, 25.3],
              [82.9, 25.3],
              [82.9, 25.2],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: 'const-003',
          name: 'Mumbai North',
          state: 'Maharashtra',
          winner: 'Gajanan Kirtikar',
          party: 'Shiv Sena',
          turnout: 55.2,
          votes: 850000,
          margin: 45000,
          competitive_index: 72,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [72.8, 19.1],
              [72.9, 19.1],
              [72.9, 19.2],
              [72.8, 19.2],
              [72.8, 19.1],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: 'const-004',
          name: 'Chennai Central',
          state: 'Tamil Nadu',
          winner: 'Dayanidhi Maran',
          party: 'DMK',
          turnout: 58.7,
          votes: 720000,
          margin: 120000,
          competitive_index: 55,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [80.2, 13.0],
              [80.3, 13.0],
              [80.3, 13.1],
              [80.2, 13.1],
              [80.2, 13.0],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          id: 'const-005',
          name: 'New Delhi',
          state: 'Delhi',
          winner: 'Meenakshi Lekhi',
          party: 'BJP',
          turnout: 60.1,
          votes: 580000,
          margin: 95000,
          competitive_index: 48,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [77.2, 28.6],
              [77.3, 28.6],
              [77.3, 28.7],
              [77.2, 28.7],
              [77.2, 28.6],
            ],
          ],
        },
      },
    ],
  };
}
