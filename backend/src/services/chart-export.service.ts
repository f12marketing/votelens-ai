import { BaseService } from './base.service';
import { ChartExportConfig, ChartExportResult } from '../types/report.schema';

export class ChartExportService extends BaseService {
  /**
   * Export chart as PNG
   */
  async exportChartAsPNG(config: ChartExportConfig, _chartData: any): Promise<ChartExportResult> {
    const exportId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, use a chart library like Chart.js, D3.js, or canvas-to-blob
    // For now, we'll generate a mock PNG export result
    const size = this.estimateFileSize(config);
    const dimensions = {
      width: config.width || 800,
      height: config.height || 600,
    };

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      id: exportId,
      format: 'png',
      url: `/charts/${exportId}.png`,
      expiresAt,
      size,
      dimensions,
    };
  }

  /**
   * Export chart as SVG
   */
  async exportChartAsSVG(config: ChartExportConfig, _chartData: any): Promise<ChartExportResult> {
    const exportId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const svgContent = this.generateSVGContent(config, _chartData);
    const size = new Blob([svgContent]).size;
    const dimensions = {
      width: config.width || 800,
      height: config.height || 600,
    };

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      id: exportId,
      format: 'svg',
      url: `/charts/${exportId}.svg`,
      expiresAt,
      size,
      dimensions,
    };
  }

  /**
   * Export chart as PDF
   */
  async exportChartAsPDF(config: ChartExportConfig, _chartData: any): Promise<ChartExportResult> {
    const exportId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const size = this.estimateFileSize(config);
    const dimensions = {
      width: config.width || 800,
      height: config.height || 600,
    };

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      id: exportId,
      format: 'pdf',
      url: `/charts/${exportId}.pdf`,
      expiresAt,
      size,
      dimensions,
    };
  }

  /**
   * Generate SVG content
   */
  private generateSVGContent(config: ChartExportConfig, chartData: any): string {
    const width = config.width || 800;
    const height = config.height || 600;
    const backgroundColor = config.backgroundColor || '#ffffff';

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;

    // Add title if configured
    if (config.includeTitle && chartData.title) {
      svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">${chartData.title}</text>`;
    }

    // Add chart visualization based on type
    svg += this.generateChartVisualization(chartData, width, height, config);

    // Add legend if configured
    if (config.includeLegend && chartData.legend) {
      svg += this.generateLegend(chartData.legend, width, height);
    }

    svg += '</svg>';

    return svg;
  }

  /**
   * Generate chart visualization
   */
  private generateChartVisualization(chartData: any, width: number, height: number, _config: ChartExportConfig): string {
    const chartType = chartData.type || 'bar';
    const data = chartData.data || [];
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    let svg = '';

    switch (chartType) {
      case 'bar':
        svg = this.generateBarChart(data, padding, padding, chartWidth, chartHeight);
        break;
      case 'line':
        svg = this.generateLineChart(data, padding, padding, chartWidth, chartHeight);
        break;
      case 'pie':
        svg = this.generatePieChart(data, width / 2, height / 2, Math.min(chartWidth, chartHeight) / 2);
        break;
      case 'scatter':
        svg = this.generateScatterChart(data, padding, padding, chartWidth, chartHeight);
        break;
      default:
        svg = '<text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#666">Chart type not implemented</text>';
    }

    return svg;
  }

  /**
   * Generate bar chart
   */
  private generateBarChart(data: any[], x: number, y: number, width: number, height: number): string {
    if (data.length === 0) return '';

    let svg = `<g transform="translate(${x}, ${y})">`;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length;
    const barPadding = barWidth * 0.2;

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * height;
      const xPos = index * barWidth + barPadding / 2;
      const yPos = height - barHeight;

      svg += `<rect x="${xPos}" y="${yPos}" width="${barWidth - barPadding}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
      svg += `<text x="${xPos + (barWidth - barPadding) / 2}" y="${yPos - 10}" text-anchor="middle" font-size="12" fill="#333">${item.value}</text>`;
      svg += `<text x="${xPos + (barWidth - barPadding) / 2}" y="${height + 20}" text-anchor="middle" font-size="11" fill="#666">${item.label}</text>`;
    });

    svg += '</g>';

    // Add axes
    svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;
    svg += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;

    return svg;
  }

  /**
   * Generate line chart
   */
  private generateLineChart(data: any[], x: number, y: number, width: number, height: number): string {
    if (data.length === 0) return '';

    let svg = `<g transform="translate(${x}, ${y})">`;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const pointSpacing = width / (data.length - 1 || 1);

    let pathD = '';
    data.forEach((item, index) => {
      const xPos = index * pointSpacing;
      const yPos = height - (item.value / maxValue) * height;

      if (index === 0) {
        pathD += `M ${xPos} ${yPos}`;
      } else {
        pathD += ` L ${xPos} ${yPos}`;
      }

      svg += `<circle cx="${xPos}" cy="${yPos}" r="5" fill="#3b82f6"/>`;
      svg += `<text x="${xPos}" y="${height + 20}" text-anchor="middle" font-size="11" fill="#666">${item.label}</text>`;
    });

    svg += `<path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="3"/>`;
    svg += '</g>';

    // Add axes
    svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;
    svg += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;

    return svg;
  }

  /**
   * Generate pie chart
   */
  private generatePieChart(data: any[], cx: number, cy: number, radius: number): string {
    if (data.length === 0) return '';

    let svg = '';
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = 0;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      svg += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${colors[index % colors.length]}" stroke="#fff" stroke-width="2"/>`;

      // Add label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = cx + (radius * 0.7) * Math.cos(labelAngle);
      const labelY = cy + (radius * 0.7) * Math.sin(labelAngle);
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11" fill="#fff">${item.label}</text>`;

      startAngle = endAngle;
    });

    return svg;
  }

  /**
   * Generate scatter chart
   */
  private generateScatterChart(data: any[], x: number, y: number, width: number, height: number): string {
    if (data.length === 0) return '';

    let svg = `<g transform="translate(${x}, ${y})">`;
    
    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => d.y));

    data.forEach((item) => {
      const xPos = (item.x / maxX) * width;
      const yPos = height - (item.y / maxY) * height;

      svg += `<circle cx="${xPos}" cy="${yPos}" r="6" fill="#3b82f6" opacity="0.7"/>`;
    });

    svg += '</g>';

    // Add axes
    svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;
    svg += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="#ccc" stroke-width="2"/>`;

    return svg;
  }

  /**
   * Generate legend
   */
  private generateLegend(legend: any[], width: number, height: number): string {
    let svg = `<g transform="translate(${width - 150}, ${height - 100})">`;
    
    legend.forEach((item, index) => {
      const yPos = index * 25;
      svg += `<rect x="0" y="${yPos}" width="15" height="15" fill="${item.color || '#3b82f6'}"/>`;
      svg += `<text x="25" y="${yPos + 12}" font-size="12" fill="#333">${item.label}</text>`;
    });

    svg += '</g>';

    return svg;
  }

  /**
   * Estimate file size
   */
  private estimateFileSize(config: ChartExportConfig): number {
    const baseSize = 50000; // 50KB base
    const width = config.width || 800;
    const height = config.height || 600;
    const qualityMultiplier = config.quality === 'high' ? 2 : config.quality === 'medium' ? 1.5 : 1;

    return Math.floor(baseSize * (width * height / 480000) * qualityMultiplier);
  }

  /**
   * Validate chart export config
   */
  validateConfig(config: ChartExportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.chartId) {
      errors.push('Chart ID is required');
    }

    if (!config.format || !['png', 'svg', 'pdf'].includes(config.format)) {
      errors.push('Invalid format');
    }

    if (config.width && config.width < 100) {
      errors.push('Width must be at least 100px');
    }

    if (config.height && config.height < 100) {
      errors.push('Height must be at least 100px');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Batch export multiple charts
   */
  async batchExportCharts(configs: ChartExportConfig[], chartDataMap: Map<string, any>): Promise<ChartExportResult[]> {
    const results: ChartExportResult[] = [];

    for (const config of configs) {
      const chartData = chartDataMap.get(config.chartId);
      if (chartData) {
        let result: ChartExportResult;

        switch (config.format) {
          case 'png':
            result = await this.exportChartAsPNG(config, chartData);
            break;
          case 'svg':
            result = await this.exportChartAsSVG(config, chartData);
            break;
          case 'pdf':
            result = await this.exportChartAsPDF(config, chartData);
            break;
          default:
            continue;
        }

        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get supported chart formats
   */
  getSupportedFormats(): Array<{ format: string; description: string; features: string[] }> {
    return [
      {
        format: 'png',
        description: 'Raster image format',
        features: ['Universal compatibility', 'Lossy compression', 'Web-friendly'],
      },
      {
        format: 'svg',
        description: 'Vector image format',
        features: ['Scalable', 'Editable', 'Small file size'],
      },
      {
        format: 'pdf',
        description: 'Document format',
        features: ['Print-ready', 'Vector quality', 'Preserves formatting'],
      },
    ];
  }
}

// Singleton instance
let chartExportService: ChartExportService | null = null;

export function getChartExportService(): ChartExportService {
  if (!chartExportService) {
    chartExportService = new ChartExportService();
  }
  return chartExportService;
}
