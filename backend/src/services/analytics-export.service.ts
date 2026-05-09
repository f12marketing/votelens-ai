import { BaseService } from './base.service';
import { ExportOptions, ExportResult } from '../types/analytics-workspace.schema';
import { AnalyticsWorkspace } from '../types/analytics-workspace.schema';

export class AnalyticsExportService extends BaseService {
  /**
   * Export workspace insights
   */
  async exportWorkspace(
    workspace: AnalyticsWorkspace,
    options: ExportOptions
  ): Promise<ExportResult> {
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let content: string;
    let fileExtension: string;

    switch (options.format) {
      case 'json':
        content = this.exportToJSON(workspace, options);
        fileExtension = 'json';
        break;
      case 'csv':
        content = this.exportToCSV(workspace, options);
        fileExtension = 'csv';
        break;
      case 'pdf':
        content = this.exportToPDF(workspace, options);
        fileExtension = 'pdf';
        break;
      case 'excel':
        content = this.exportToExcel(workspace, options);
        fileExtension = 'xlsx';
        break;
      case 'ppt':
        content = this.exportToPPT(workspace, options);
        fileExtension = 'pptx';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // In production, this would save to cloud storage and return a URL
    // For now, we'll return a mock result
    const size = new Blob([content]).size;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      id: exportId,
      format: options.format,
      url: `/exports/${exportId}.${fileExtension}`,
      expiresAt,
      size,
      pageCount: options.format === 'pdf' ? this.estimatePageCount(workspace) : undefined,
    };
  }

  /**
   * Export to JSON
   */
  private exportToJSON(workspace: AnalyticsWorkspace, options: ExportOptions): string {
    const exportData: any = {
      metadata: {
        name: workspace.name,
        description: workspace.description,
        exportedAt: new Date().toISOString(),
        customTitle: options.customTitle,
        customSubtitle: options.customSubtitle,
      },
      filters: workspace.filters,
    };

    if (options.includeInsights) {
      exportData.insights = workspace.insights;
    }

    if (options.includeRawData) {
      exportData.constituencyAnalytics = workspace.constituencyAnalytics;
    }

    if (options.includeRecommendations) {
      exportData.recommendations = this.generateRecommendations(workspace);
    }

    if (options.includeCharts) {
      exportData.charts = this.generateChartConfigs(workspace);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export to CSV
   */
  private exportToCSV(workspace: AnalyticsWorkspace, options: ExportOptions): string {
    const rows: string[] = [];

    // Header
    rows.push('Type,ID,Title,Description,Confidence,Impact,Urgency');

    // Insights
    if (options.includeInsights) {
      for (const insight of workspace.insights) {
        rows.push(
          [
            'Insight',
            insight.id,
            insight.title,
            insight.description.replace(/,/g, ';'),
            insight.confidence,
            insight.impact,
            insight.urgency,
          ].join(',')
        );
      }
    }

    // Constituency analytics
    if (options.includeRawData) {
      rows.push(''); // Empty line
      rows.push('Constituency Analytics');
      rows.push('Constituency ID,Name,State,Turnout Trend,Competitiveness,Flip Risk,Swing Potential');

      for (const analytics of workspace.constituencyAnalytics) {
        rows.push(
          [
            analytics.constituencyId,
            analytics.constituencyName,
            analytics.state,
            analytics.turnoutTrend.direction,
            analytics.competitiveness.classification,
            analytics.predictiveIndicators.flipRisk,
            analytics.predictiveIndicators.swingPotential,
          ].join(',')
        );
      }
    }

    return rows.join('\n');
  }

  /**
   * Export to PDF (mock implementation)
   */
  private exportToPDF(workspace: AnalyticsWorkspace, options: ExportOptions): string {
    // In production, use a PDF generation library like pdfkit or puppeteer
    const content = `
# ${options.customTitle || workspace.name}
${options.customSubtitle || workspace.description}

## Summary
- Total Insights: ${workspace.summary.totalInsights}
- High Priority Insights: ${workspace.summary.highPriorityInsights}
- Total Constituencies: ${workspace.summary.totalConstituencies}

## Key Metrics
${workspace.summary.keyMetrics.map(m => `- ${m.label}: ${m.value}${m.change ? ` (${m.change > 0 ? '+' : ''}${m.change})` : ''}`).join('\n')}

${options.includeInsights ? '## Insights\n' + workspace.insights.map(i => `### ${i.title}\n${i.description}\n`).join('\n') : ''}

${options.includeRecommendations ? '## Recommendations\n' + this.generateRecommendations(workspace).join('\n') : ''}
    `.trim();

    return content;
  }

  /**
   * Export to Excel (mock implementation)
   */
  private exportToExcel(workspace: AnalyticsWorkspace, options: ExportOptions): string {
    // In production, use a library like exceljs
    return this.exportToCSV(workspace, options);
  }

  /**
   * Export to PowerPoint (mock implementation)
   */
  private exportToPPT(workspace: AnalyticsWorkspace, options: ExportOptions): string {
    // In production, use a library like pptxgenjs
    return this.exportToPDF(workspace, options);
  }

  /**
   * Generate recommendations from workspace
   */
  private generateRecommendations(workspace: AnalyticsWorkspace): string[] {
    const recommendations: string[] = [];

    // Based on insights
    const highPriorityInsights = workspace.insights.filter(i => i.urgency === 'immediate');
    if (highPriorityInsights.length > 0) {
      recommendations.push(`Immediate attention required for ${highPriorityInsights.length} high-priority insights.`);
    }

    // Based on constituency analytics
    const highFlipRisk = workspace.constituencyAnalytics.filter(a => a.predictiveIndicators.flipRisk > 0.7);
    if (highFlipRisk.length > 0) {
      recommendations.push(`${highFlipRisk.length} constituencies at high flip risk require monitoring.`);
    }

    const highSwingPotential = workspace.constituencyAnalytics.filter(a => a.predictiveIndicators.swingPotential > 0.7);
    if (highSwingPotential.length > 0) {
      recommendations.push(`${highSwingPotential.length} constituencies show high swing potential.`);
    }

    return recommendations;
  }

  /**
   * Generate chart configurations
   */
  private generateChartConfigs(workspace: AnalyticsWorkspace): any[] {
    const charts: any[] = [];

    // Insight distribution by type
    const insightTypes = new Map<string, number>();
    workspace.insights.forEach(i => {
      insightTypes.set(i.type, (insightTypes.get(i.type) || 0) + 1);
    });

    charts.push({
      type: 'pie',
      title: 'Insights by Type',
      data: {
        labels: Array.from(insightTypes.keys()),
        datasets: [{
          data: Array.from(insightTypes.values()),
        }],
      },
    });

    // Insight distribution by priority
    const priorityCounts = new Map<string, number>();
    workspace.insights.forEach(i => {
      priorityCounts.set(i.urgency, (priorityCounts.get(i.urgency) || 0) + 1);
    });

    charts.push({
      type: 'bar',
      title: 'Insights by Priority',
      data: {
        labels: Array.from(priorityCounts.keys()),
        datasets: [{
          label: 'Count',
          data: Array.from(priorityCounts.values()),
        }],
      },
    });

    return charts;
  }

  /**
   * Estimate page count for PDF export
   */
  private estimatePageCount(workspace: AnalyticsWorkspace): number {
    let pages = 1; // Cover page

    // Summary page
    pages += 1;

    // Insights pages (10 insights per page)
    if (workspace.insights.length > 0) {
      pages += Math.ceil(workspace.insights.length / 10);
    }

    // Constituency analytics pages (20 per page)
    if (workspace.constituencyAnalytics.length > 0) {
      pages += Math.ceil(workspace.constituencyAnalytics.length / 20);
    }

    // Charts pages
    pages += 1;

    return pages;
  }

  /**
   * Get available export formats
   */
  getAvailableFormats(): Array<{ format: string; description: string; features: string[] }> {
    return [
      {
        format: 'json',
        description: 'Machine-readable JSON format',
        features: ['Full data', 'Preserves structure', 'API-friendly'],
      },
      {
        format: 'csv',
        description: 'Comma-separated values for spreadsheets',
        features: ['Tabular data', 'Excel compatible', 'Lightweight'],
      },
      {
        format: 'pdf',
        description: 'Professional PDF report',
        features: ['Print-ready', 'Formatted', 'Shareable'],
      },
      {
        format: 'excel',
        description: 'Microsoft Excel workbook',
        features: ['Multiple sheets', 'Charts', 'Formulas'],
      },
      {
        format: 'ppt',
        description: 'PowerPoint presentation',
        features: ['Slides', 'Visualizations', 'Presentations'],
      },
    ];
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const validFormats = ['pdf', 'excel', 'csv', 'json', 'ppt'];
    if (!validFormats.includes(options.format)) {
      errors.push(`Invalid format: ${options.format}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate export filename
   */
  generateFilename(workspaceName: string, format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = workspaceName.replace(/[^a-zA-Z0-9]/g, '-');
    return `${sanitizedName}-${timestamp}.${format}`;
  }

  /**
   * Get export history for a workspace
   */
  getExportHistory(_workspaceId: string): Array<{
    id: string;
    format: string;
    exportedAt: Date;
    exportedBy: string;
  }> {
    // In production, this would query a database
    return [
      {
        id: 'export-1',
        format: 'pdf',
        exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        exportedBy: 'user@example.com',
      },
    ];
  }

  /**
   * Schedule recurring export
   */
  scheduleRecurringExport(
    _workspaceId: string,
    _options: ExportOptions,
    schedule: 'daily' | 'weekly' | 'monthly'
  ): { jobId: string; nextRun: Date } {
    // In production, this would use a job scheduler
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let nextRun = new Date();

    switch (schedule) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    return {
      jobId,
      nextRun,
    };
  }
}

// Singleton instance
let analyticsExportService: AnalyticsExportService | null = null;

export function getAnalyticsExportService(): AnalyticsExportService {
  if (!analyticsExportService) {
    analyticsExportService = new AnalyticsExportService();
  }
  return analyticsExportService;
}
