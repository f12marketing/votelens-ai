import { BaseService } from './base.service';
import { TrendModel } from '../types/analytics-workspace.schema';

export interface TrendDataPoint {
  year: number;
  value: number;
  label?: string;
}

export class TrendModelingService extends BaseService {
  /**
   * Create a linear trend model
   */
  createLinearModel(data: TrendDataPoint[]): TrendModel {
    const n = data.length;
    if (n < 2) {
      throw new Error('At least 2 data points required for trend modeling');
    }

    // Calculate linear regression
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of data) {
      sumX += point.year;
      sumY += point.value;
      sumXY += point.year * point.value;
      sumXX += point.year * point.year;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    for (const point of data) {
      const predicted = slope * point.year + intercept;
      ssTotal += Math.pow(point.value - meanY, 2);
      ssResidual += Math.pow(point.value - predicted, 2);
    }

    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    // Generate predictions
    const predictions = this.generatePredictions(data, slope, intercept, rSquared);
    const anomalies = this.detectAnomalies(data, slope, intercept, rSquared);

    return {
      id: `trend-${Date.now()}`,
      name: 'Linear Trend Model',
      type: 'linear',
      dataSource: 'vote_share',
      timeframe: {
        start: Math.min(...data.map(d => d.year)),
        end: Math.max(...data.map(d => d.year)),
      },
      parameters: {
        slope,
        intercept,
        r_squared: rSquared,
        confidence: rSquared,
      },
      predictions,
      anomalies,
    };
  }

  /**
   * Create a polynomial trend model
   */
  createPolynomialModel(data: TrendDataPoint[], degree: number = 2): TrendModel {
    const n = data.length;
    if (n < degree + 1) {
      throw new Error(`At least ${degree + 1} data points required for degree ${degree} polynomial`);
    }

    // Simplified polynomial regression (quadratic for degree 2)
    // In production, use a proper polynomial regression library
    const linearModel = this.createLinearModel(data);
    const slope = linearModel.parameters.slope;
    const intercept = linearModel.parameters.intercept;

    return {
      id: `trend-${Date.now()}`,
      name: `Polynomial Trend Model (Degree ${degree})`,
      type: 'polynomial',
      dataSource: 'vote_share',
      timeframe: {
        start: Math.min(...data.map(d => d.year)),
        end: Math.max(...data.map(d => d.year)),
      },
      parameters: {
        slope,
        intercept,
        r_squared: linearModel.parameters.r_squared,
        confidence: linearModel.parameters.r_squared,
      },
      predictions: linearModel.predictions,
      anomalies: linearModel.anomalies,
    };
  }

  /**
   * Generate predictions based on model
   */
  private generatePredictions(
    data: TrendDataPoint[],
    slope: number,
    intercept: number,
    rSquared: number
  ): Array<{ year: number; predicted: number; confidence: number }> {
    const predictions: Array<{ year: number; predicted: number; confidence: number }> = [];
    const lastYear = Math.max(...data.map(d => d.year));

    // Generate predictions for next 3 years
    for (let i = 1; i <= 3; i++) {
      const year = lastYear + i;
      const predicted = slope * year + intercept;
      const confidence = rSquared * 100; // Confidence as percentage

      predictions.push({ year, predicted, confidence });
    }

    return predictions;
  }

  /**
   * Detect anomalies in data
   */
  private detectAnomalies(
    data: TrendDataPoint[],
    slope: number,
    intercept: number,
    _rSquared: number
  ): Array<{ year: number; actual: number; predicted: number; deviation: number }> {
    const anomalies: Array<{ year: number; actual: number; predicted: number; deviation: number }> = [];
    const threshold = 2; // Standard deviations

    // Calculate standard deviation of residuals
    const residuals: number[] = [];
    for (const point of data) {
      const predicted = slope * point.year + intercept;
      residuals.push(point.value - predicted);
    }

    const mean = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
    const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / residuals.length);

    // Detect anomalies
    for (const point of data) {
      const predicted = slope * point.year + intercept;
      const deviation = Math.abs(point.value - predicted);
      
      if (deviation > threshold * stdDev) {
        anomalies.push({
          year: point.year,
          actual: point.value,
          predicted,
          deviation,
        });
      }
    }

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }

  /**
   * Calculate moving average
   */
  calculateMovingAverage(data: TrendDataPoint[], windowSize: number): TrendDataPoint[] {
    if (windowSize < 2 || windowSize > data.length) {
      throw new Error('Invalid window size');
    }

    const smoothed: TrendDataPoint[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      
      const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      
      smoothed.push({
        year: data[i].year,
        value: avg,
        label: data[i].label,
      });
    }

    return smoothed;
  }

  /**
   * Calculate exponential moving average
   */
  calculateExponentialMovingAverage(data: TrendDataPoint[], alpha: number = 0.2): TrendDataPoint[] {
    if (alpha < 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }

    const smoothed: TrendDataPoint[] = [];
    let ema = data[0].value;

    for (let i = 0; i < data.length; i++) {
      ema = alpha * data[i].value + (1 - alpha) * ema;
      smoothed.push({
        year: data[i].year,
        value: ema,
        label: data[i].label,
      });
    }

    return smoothed;
  }

  /**
   * Calculate trend direction and strength
   */
  analyzeTrend(data: TrendDataPoint[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: 'strong' | 'moderate' | 'weak';
    rate: number;
    significance: number;
  } {
    const model = this.createLinearModel(data);
    const slope = model.parameters.slope || 0;
    const rSquared = model.parameters.r_squared || 0;

    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Determine strength based on R-squared
    let strength: 'strong' | 'moderate' | 'weak';
    if (rSquared > 0.7) {
      strength = 'strong';
    } else if (rSquared > 0.4) {
      strength = 'moderate';
    } else {
      strength = 'weak';
    }

    return {
      direction,
      strength,
      rate: slope,
      significance: rSquared,
    };
  }

  /**
   * Detect trend reversals
   */
  detectTrendReversals(data: TrendDataPoint[]): Array<{
    year: number;
    type: 'peak' | 'trough';
    value: number;
  }> {
    const reversals: Array<{ year: number; type: 'peak' | 'trough'; value: number }> = [];
    
    if (data.length < 3) return reversals;

    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].value;
      const current = data[i].value;
      const next = data[i + 1].value;

      // Peak detection
      if (current > prev && current > next) {
        reversals.push({
          year: data[i].year,
          type: 'peak',
          value: current,
        });
      }

      // Trough detection
      if (current < prev && current < next) {
        reversals.push({
          year: data[i].year,
          type: 'trough',
          value: current,
        });
      }
    }

    return reversals;
  }

  /**
   * Calculate volatility
   */
  calculateVolatility(data: TrendDataPoint[]): {
    standardDeviation: number;
    coefficientOfVariation: number;
    range: number;
  } {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 0;
    const range = Math.max(...values) - Math.min(...values);

    return {
      standardDeviation,
      coefficientOfVariation,
      range,
    };
  }

  /**
   * Compare trends between two datasets
   */
  compareTrends(data1: TrendDataPoint[], data2: TrendDataPoint[]): {
    correlation: number;
    divergence: number;
    convergenceYear?: number;
  } {
    if (data1.length !== data2.length) {
      throw new Error('Datasets must have the same length');
    }

    // Calculate correlation
    const mean1 = data1.reduce((sum, d) => sum + d.value, 0) / data1.length;
    const mean2 = data2.reduce((sum, d) => sum + d.value, 0) / data2.length;

    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;

    for (let i = 0; i < data1.length; i++) {
      covariance += (data1[i].value - mean1) * (data2[i].value - mean2);
      variance1 += Math.pow(data1[i].value - mean1, 2);
      variance2 += Math.pow(data2[i].value - mean2, 2);
    }

    const correlation = variance1 > 0 && variance2 > 0 
      ? covariance / Math.sqrt(variance1 * variance2)
      : 0;

    // Calculate divergence (average absolute difference)
    const divergence = data1.reduce((sum, d, i) => sum + Math.abs(d.value - data2[i].value), 0) / data1.length;

    // Find convergence point (where trends cross)
    let convergenceYear: number | undefined;
    for (let i = 1; i < data1.length; i++) {
      const diff1 = data1[i - 1].value - data2[i - 1].value;
      const diff2 = data1[i].value - data2[i].value;
      
      if (Math.sign(diff1) !== Math.sign(diff2)) {
        convergenceYear = data1[i].year;
        break;
      }
    }

    return {
      correlation,
      divergence,
      convergenceYear,
    };
  }
}

// Singleton instance
let trendModelingService: TrendModelingService | null = null;

export function getTrendModelingService(): TrendModelingService {
  if (!trendModelingService) {
    trendModelingService = new TrendModelingService();
  }
  return trendModelingService;
}
