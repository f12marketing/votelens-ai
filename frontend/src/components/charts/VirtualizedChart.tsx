import React, { useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

/**
 * Virtualized Chart Component
 * Optimizes rendering of large datasets by only rendering visible items
 */

interface VirtualizedChartProps {
  data: any[];
  itemHeight: number;
  height: number;
  width: number | string;
  renderItem: (props: ListChildComponentProps) => React.ReactNode;
  overscanCount?: number;
}

export const VirtualizedChart: React.FC<VirtualizedChartProps> = ({
  data,
  itemHeight,
  height,
  width,
  renderItem,
  overscanCount = 5,
}) => {
  return (
    <List
      height={height}
      itemCount={data.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
    >
      {renderItem}
    </List>
  );
};

/**
 * Data Sampling Utility
 * Reduces dataset size for visualization while preserving trends
 */
export function sampleData<T>(
  data: T[],
  maxPoints: number,
  strategy: 'uniform' | 'lttb' | 'minmax' = 'lttb'
): T[] {
  if (data.length <= maxPoints) return data;

  switch (strategy) {
    case 'uniform':
      return uniformSample(data, maxPoints);
    case 'lttb':
      return lttbSample(data as any, maxPoints) as T[];
    case 'minmax':
      return minmaxSample(data as any, maxPoints) as T[];
    default:
      return uniformSample(data, maxPoints);
  }
}

/**
 * Uniform sampling - simple but preserves less detail
 */
function uniformSample<T>(data: T[], maxPoints: number): T[] {
  const step = Math.floor(data.length / maxPoints);
  const sampled: T[] = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled.slice(0, maxPoints);
}

/**
 * Largest-Triangle-Three-Buckets (LTTB) sampling
 * Preserves visual trends and outliers
 */
function lttbSample(data: any[], maxPoints: number): any[] {
  if (data.length <= maxPoints) return data;

  const sampled: any[] = [];
  const bucketSize = (data.length - 2) / (maxPoints - 2);

  // Always include first point
  sampled.push(data[0]);

  for (let i = 0; i < maxPoints - 2; i++) {
    const start = Math.floor((i * bucketSize) + 1);
    const end = Math.floor((i + 1) * bucketSize) + 1;
    const bucket = data.slice(start, end);

    if (bucket.length === 0) continue;

    // Find the point that creates the largest triangle
    let maxArea = -1;
    let selectedPoint = bucket[0];

    const prevPoint = sampled[sampled.length - 1];
    const nextPoint = data[Math.min(end, data.length - 1)];

    for (const point of bucket) {
      const area = calculateTriangleArea(prevPoint, point, nextPoint);
      if (area > maxArea) {
        maxArea = area;
        selectedPoint = point;
      }
    }

    sampled.push(selectedPoint);
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Min-Max sampling
 * Preserves peaks and valleys
 */
function minmaxSample(data: any[], maxPoints: number): any[] {
  if (data.length <= maxPoints) return data;

  const sampled: any[] = [];
  const bucketSize = Math.floor(data.length / maxPoints);

  for (let i = 0; i < maxPoints; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, data.length);
    const bucket = data.slice(start, end);

    if (bucket.length === 0) continue;

    // Find min and max in bucket
    let minPoint = bucket[0];
    let maxPoint = bucket[0];
    let minValue = bucket[0].value || bucket[0].y || 0;
    let maxValue = minValue;

    for (const point of bucket) {
      const value = point.value || point.y || 0;
      if (value < minValue) {
        minValue = value;
        minPoint = point;
      }
      if (value > maxValue) {
        maxValue = value;
        maxPoint = point;
      }
    }

    sampled.push(minPoint);
    if (minPoint !== maxPoint) {
      sampled.push(maxPoint);
    }
  }

  return sampled.slice(0, maxPoints);
}

/**
 * Calculate triangle area for LTTB
 */
function calculateTriangleArea(p1: any, p2: any, p3: any): number {
  const x1 = p1.x || 0;
  const y1 = p1.y || p1.value || 0;
  const x2 = p2.x || 0;
  const y2 = p2.y || p2.value || 0;
  const x3 = p3.x || 0;
  const y3 = p3.y || p3.value || 0;

  return Math.abs(
    (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2
  );
}

/**
 * Progressive Chart Component
 * Renders chart in chunks to prevent blocking
 */
interface ProgressiveChartProps {
  data: any[];
  chunkSize: number;
  renderChunk: (chunk: any[]) => React.ReactNode;
  delay?: number;
}

export const ProgressiveChart: React.FC<ProgressiveChartProps> = ({
  data,
  chunkSize = 1000,
  renderChunk,
  delay = 0,
}) => {
  const [renderedChunks, setRenderedChunks] = React.useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const requestRef = useRef<number>();

  useEffect(() => {
    const renderNextChunk = () => {
      if (currentIndex >= data.length) return;

      const endIndex = Math.min(currentIndex + chunkSize, data.length);
      const chunk = data.slice(currentIndex, endIndex);

      setRenderedChunks(prev => [...prev, ...chunk]);
      setCurrentIndex(endIndex);

      if (endIndex < data.length) {
        requestRef.current = requestAnimationFrame(() => {
          if (delay > 0) {
            setTimeout(renderNextChunk, delay);
          } else {
            renderNextChunk();
          }
        });
      }
    };

    renderNextChunk();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [currentIndex, data, chunkSize, delay]);

  return <>{renderChunk(renderedChunks)}</>;
};

/**
 * Canvas-based Chart Renderer
 * Uses HTML5 Canvas for high-performance rendering
 */
export class CanvasChartRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLine(points: { x: number; y: number }[], color: string, lineWidth: number = 2) {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();
  }

  drawBar(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawPoint(x: number, y: number, radius: number, color: string) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawText(text: string, x: number, y: number, color: string = '#000', fontSize: number = 12) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.fillText(text, x, y);
  }

  drawGrid(
    width: number,
    height: number,
    rows: number,
    cols: number,
    color: string = '#e0e0e0'
  ) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
      const y = (height / rows) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = (width / cols) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
  }

  setDimensions(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  toDataURL(type: string = 'image/png'): string {
    return this.canvas.toDataURL(type);
  }
}

/**
 * Web Worker for off-thread chart processing
 */
export function createChartWorker() {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, data, options } = e.data;
      
      switch (type) {
        case 'sample':
          const sampled = sampleData(data, options.maxPoints, options.strategy);
          self.postMessage({ type: 'sample', data: sampled });
          break;
        case 'aggregate':
          const aggregated = aggregateData(data, options.groupBy, options.aggregations);
          self.postMessage({ type: 'aggregate', data: aggregated });
          break;
        case 'filter':
          const filtered = filterData(data, options.filters);
          self.postMessage({ type: 'filter', data: filtered });
          break;
      }
    };
    
    function sampleData(data, maxPoints, strategy) {
      // Simple uniform sampling
      if (data.length <= maxPoints) return data;
      const step = Math.floor(data.length / maxPoints);
      return data.filter((_, i) => i % step === 0).slice(0, maxPoints);
    }
    
    function aggregateData(data, groupBy, aggregations) {
      const groups = {};
      data.forEach(item => {
        const key = item[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      
      return Object.entries(groups).map(([key, items]) => {
        const result = { [groupBy]: key };
        Object.entries(aggregations).forEach(([field, agg]) => {
          const values = items.map(i => i[field]);
          result[field] = agg === 'sum' ? values.reduce((a, b) => a + b, 0)
                     : agg === 'avg' ? values.reduce((a, b) => a + b, 0) / values.length
                     : agg === 'min' ? Math.min(...values)
                     : agg === 'max' ? Math.max(...values)
                     : values[0];
        });
        return result;
      });
    }
    
    function filterData(data, filters) {
      return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (typeof value === 'function') return value(item[key]);
          return item[key] === value;
        });
      });
    }
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

/**
 * Chart Performance Monitor
 */
export class ChartPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getMedian(name: string): number {
    const values = [...(this.metrics.get(name) || [])].sort((a, b) => a - b);
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  getPercentile(name: string, percentile: number): number {
    const values = [...(this.metrics.get(name) || [])].sort((a, b) => a - b);
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }

  clear() {
    this.metrics.clear();
  }

  getReport() {
    const report: Record<string, any> = {};
    this.metrics.forEach((values, name) => {
      report[name] = {
        count: values.length,
        average: this.getAverage(name),
        median: this.getMedian(name),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99),
      };
    });
    return report;
  }
}
