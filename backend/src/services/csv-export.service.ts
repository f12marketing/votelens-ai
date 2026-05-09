import { BaseService } from './base.service';
import { ReportConfig, ExportResult } from '../types/report.schema';

export class CSVExportService extends BaseService {
  /**
   * Generate CSV export
   */
  async generateCSVExport(
    config: ReportConfig,
    data: any
  ): Promise<ExportResult> {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const csvContent = this.generateCSVContent(data, config);

    const size = new Blob([csvContent]).size;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      id: exportId,
      format: 'csv',
      url: `/exports/${exportId}.csv`,
      expiresAt,
      size,
      metadata: {
        generatedAt: new Date(),
        processingTime: 0,
        dataPoints: this.countDataPoints(data),
      },
    };
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(data: any, config: ReportConfig): string {
    let content = '';

    // Header
    content += this.generateCSVHeader(config);

    // Data rows
    content += this.generateCSVDataRows(data);

    // Footer
    content += this.generateCSVFooter(config);

    return content;
  }

  /**
   * Generate CSV header
   */
  private generateCSVHeader(config: ReportConfig): string {
    let header = '';
    
    header += `# ${config.name}\n`;
    header += `# Generated on: ${new Date().toISOString()}\n`;
    header += `# Description: ${config.description || ''}\n`;
    header += '\n';

    return header;
  }

  /**
   * Generate CSV data rows
   */
  private generateCSVDataRows(data: any): string {
    let rows = '';

    // Handle different data structures
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        rows += headers.join(',') + '\n';
        
        for (const item of data) {
          const values = headers.map(header => this.formatCSVValue(item[header]));
          rows += values.join(',') + '\n';
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      // Handle nested objects
      rows += this.flattenObjectToCSV(data);
    }

    return rows;
  }

  /**
   * Flatten object to CSV
   */
  private flattenObjectToCSV(obj: any, prefix: string = ''): string {
    let csv = '';
    const rows: any[] = [];

    const flatten = (current: any, path: string = '') => {
      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          const value = current[key];
          const newPath = path ? `${path}.${key}` : key;

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flatten(value, newPath);
          } else {
            rows.push({ key: newPath, value });
          }
        }
      }
    };

    flatten(obj, prefix);

    if (rows.length > 0) {
      csv += 'Key,Value\n';
      for (const row of rows) {
        csv += `${this.formatCSVValue(row.key)},${this.formatCSVValue(row.value)}\n`;
      }
    }

    return csv;
  }

  /**
   * Format CSV value
   */
  private formatCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Generate CSV footer
   */
  private generateCSVFooter(config: ReportConfig): string {
    let footer = '\n';
    
    if (config.branding?.footer) {
      footer += `# ${config.branding.footer}\n`;
    }

    footer += `# End of report\n`;

    return footer;
  }

  /**
   * Generate constituency-specific CSV
   */
  async generateConstituencyCSV(constituencyData: any, config: ReportConfig): Promise<ExportResult> {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let csvContent = this.generateCSVHeader(config);
    csvContent += 'Constituency,State,Year,Winner,Party,Turnout,Margin,VoteShare,TotalVotes\n';

    if (constituencyData.electionData) {
      for (const election of constituencyData.electionData) {
        csvContent += [
          constituencyData.constituencyName,
          constituencyData.state,
          election.year,
          election.winner,
          election.party,
          election.turnout,
          election.margin,
          election.voteShare,
          election.totalVotes,
        ].map(v => this.formatCSVValue(v)).join(',') + '\n';
      }
    }

    // Add performance metrics
    if (constituencyData.performanceMetrics) {
      csvContent += '\n';
      csvContent += 'Performance Metrics\n';
      csvContent += `Average Turnout,${constituencyData.performanceMetrics.averageTurnout}\n`;
      csvContent += `Average Margin,${constituencyData.performanceMetrics.averageMargin}\n`;
      csvContent += `Competitiveness,${constituencyData.performanceMetrics.competitiveness}\n`;
      csvContent += `Trend Direction,${constituencyData.performanceMetrics.trendDirection}\n`;
    }

    csvContent += this.generateCSVFooter(config);

    const size = new Blob([csvContent]).size;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      id: exportId,
      format: 'csv',
      url: `/exports/${exportId}.csv`,
      expiresAt,
      size,
      metadata: {
        generatedAt: new Date(),
        processingTime: 0,
        dataPoints: constituencyData.electionData?.length || 0,
      },
    };
  }

  /**
   * Generate analytics CSV
   */
  async generateAnalyticsCSV(analyticsData: any, config: ReportConfig): Promise<ExportResult> {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let csvContent = this.generateCSVHeader(config);

    // Insights section
    if (analyticsData.insights && analyticsData.insights.length > 0) {
      csvContent += '\nInsights\n';
      csvContent += 'Type,Title,Description,Confidence,Impact,Urgency\n';
      for (const insight of analyticsData.insights) {
        csvContent += [
          insight.type,
          insight.title,
          insight.description,
          insight.confidence,
          insight.impact,
          insight.urgency,
        ].map(v => this.formatCSVValue(v)).join(',') + '\n';
      }
    }

    // Constituency analytics section
    if (analyticsData.constituencyAnalytics && analyticsData.constituencyAnalytics.length > 0) {
      csvContent += '\nConstituency Analytics\n';
      csvContent += 'Constituency,State,Turnout Trend,Competitiveness,Flip Risk,Swing Potential\n';
      for (const analytics of analyticsData.constituencyAnalytics) {
        csvContent += [
          analytics.constituencyName,
          analytics.state,
          analytics.turnoutTrend.direction,
          analytics.competitiveness.classification,
          analytics.predictiveIndicators.flipRisk,
          analytics.predictiveIndicators.swingPotential,
        ].map(v => this.formatCSVValue(v)).join(',') + '\n';
      }
    }

    csvContent += this.generateCSVFooter(config);

    const size = new Blob([csvContent]).size;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      id: exportId,
      format: 'csv',
      url: `/exports/${exportId}.csv`,
      expiresAt,
      size,
      metadata: {
        generatedAt: new Date(),
        processingTime: 0,
        dataPoints: (analyticsData.insights?.length || 0) + (analyticsData.constituencyAnalytics?.length || 0),
      },
    };
  }

  /**
   * Count data points
   */
  private countDataPoints(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 0;
  }

  /**
   * Validate CSV data
   */
  validateCSVData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('Data is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get CSV export templates
   */
  getCSVExportTemplates(): Array<{ id: string; name: string; description: string; fields: string[] }> {
    return [
      {
        id: 'template-constituency',
        name: 'Constituency Data',
        description: 'Export constituency-level election data',
        fields: ['Constituency', 'State', 'Year', 'Winner', 'Party', 'Turnout', 'Margin', 'VoteShare', 'TotalVotes'],
      },
      {
        id: 'template-analytics',
        name: 'Analytics Summary',
        description: 'Export analytics insights and constituency analytics',
        fields: ['Type', 'Title', 'Description', 'Confidence', 'Impact', 'Urgency'],
      },
      {
        id: 'template-performance',
        name: 'Performance Metrics',
        description: 'Export performance metrics across constituencies',
        fields: ['Constituency', 'State', 'Average Turnout', 'Average Margin', 'Competitiveness'],
      },
    ];
  }
}

// Singleton instance
let csvExportService: CSVExportService | null = null;

export function getCSVExportService(): CSVExportService {
  if (!csvExportService) {
    csvExportService = new CSVExportService();
  }
  return csvExportService;
}
