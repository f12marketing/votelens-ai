import { BaseService } from './base.service';
import { ReportTemplate, ReportSection } from '../types/report.schema';

export class ReportTemplateService extends BaseService {
  // In-memory template storage (in production, use database)
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Executive Summary Template
    const executiveSummaryTemplate: ReportTemplate = {
      id: 'template-executive',
      name: 'Executive Summary',
      description: 'High-level overview for executives and stakeholders',
      type: 'executive_summary',
      sections: [
        {
          id: 'sec-cover',
          type: 'text',
          title: 'Cover Page',
          order: 1,
          config: { content: 'Cover page with branding' },
          isVisible: true,
        },
        {
          id: 'sec-summary',
          type: 'summary',
          title: 'Executive Summary',
          order: 2,
          config: { summaryType: 'executive_summary' },
          isVisible: true,
        },
        {
          id: 'sec-findings',
          type: 'summary',
          title: 'Key Findings',
          order: 3,
          config: { summaryType: 'key_findings' },
          isVisible: true,
        },
        {
          id: 'sec-recommendations',
          type: 'summary',
          title: 'Recommendations',
          order: 4,
          config: { summaryType: 'key_findings' },
          isVisible: true,
        },
        {
          id: 'sec-metrics',
          type: 'chart',
          title: 'Key Metrics Overview',
          order: 5,
          config: { chartType: 'bar', chartDataSource: 'keyMetrics', chartOptions: {} },
          isVisible: true,
        },
      ],
      defaultBranding: {
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#3b82f6',
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial',
        },
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Constituency Report Template
    const constituencyReportTemplate: ReportTemplate = {
      id: 'template-constituency',
      name: 'Constituency Report',
      description: 'Detailed constituency-level analysis and performance metrics',
      type: 'constituency_report',
      sections: [
        {
          id: 'sec-overview',
          type: 'summary',
          title: 'Overview',
          order: 1,
          config: { summaryType: 'data_summary' },
          isVisible: true,
        },
        {
          id: 'sec-elections',
          type: 'table',
          title: 'Historical Election Results',
          order: 2,
          config: {
            columns: ['year', 'winner', 'party', 'turnout', 'margin', 'voteShare'],
            tableDataSource: 'electionData',
          },
          isVisible: true,
        },
        {
          id: 'sec-turnout',
          type: 'chart',
          title: 'Turnout Trends',
          order: 3,
          config: { chartType: 'line', chartDataSource: 'turnoutTrend', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-performance',
          type: 'chart',
          title: 'Performance Metrics',
          order: 4,
          config: { chartType: 'bar', chartDataSource: 'performanceMetrics', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-demographics',
          type: 'table',
          title: 'Demographic Profile',
          order: 5,
          config: {
            columns: ['demographic', 'value'],
            tableDataSource: 'demographics',
          },
          isVisible: true,
        },
        {
          id: 'sec-comparison',
          type: 'chart',
          title: 'Comparative Analysis',
          order: 6,
          config: { chartType: 'bar', chartDataSource: 'comparisonData', chartOptions: {} },
          isVisible: true,
        },
      ],
      defaultBranding: {
        colors: {
          primary: '#059669',
          secondary: '#64748b',
          accent: '#10b981',
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial',
        },
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Analytics Report Template
    const analyticsReportTemplate: ReportTemplate = {
      id: 'template-analytics',
      name: 'Analytics Report',
      description: 'Comprehensive analytics with insights and trends',
      type: 'analytics_report',
      sections: [
        {
          id: 'sec-insights',
          type: 'summary',
          title: 'AI-Generated Insights',
          order: 1,
          config: { summaryType: 'executive_summary' },
          isVisible: true,
        },
        {
          id: 'sec-trends',
          type: 'chart',
          title: 'Trend Analysis',
          order: 2,
          config: { chartType: 'line', chartDataSource: 'trendData', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-constituencies',
          type: 'table',
          title: 'Constituency Analytics',
          order: 3,
          config: {
            columns: ['constituency', 'state', 'turnoutTrend', 'competitiveness', 'flipRisk'],
            tableDataSource: 'constituencyAnalytics',
          },
          isVisible: true,
        },
        {
          id: 'sec-swings',
          type: 'chart',
          title: 'Swing Analysis',
          order: 4,
          config: { chartType: 'scatter', chartDataSource: 'swingData', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-recommendations',
          type: 'summary',
          title: 'Strategic Recommendations',
          order: 5,
          config: { summaryType: 'key_findings' },
          isVisible: true,
        },
      ],
      defaultBranding: {
        colors: {
          primary: '#7c3aed',
          secondary: '#64748b',
          accent: '#8b5cf6',
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial',
        },
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Comparison Report Template
    const comparisonReportTemplate: ReportTemplate = {
      id: 'template-comparison',
      name: 'Comparison Report',
      description: 'Comparative analysis between elections or constituencies',
      type: 'comparison_report',
      sections: [
        {
          id: 'sec-overview',
          type: 'text',
          title: 'Comparison Overview',
          order: 1,
          config: { content: 'Overview of comparison parameters and scope' },
          isVisible: true,
        },
        {
          id: 'sec-vote-share',
          type: 'chart',
          title: 'Vote Share Comparison',
          order: 2,
          config: { chartType: 'bar', chartDataSource: 'voteShareComparison', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-turnout',
          type: 'chart',
          title: 'Turnout Shift Analysis',
          order: 3,
          config: { chartType: 'bar', chartDataSource: 'turnoutShifts', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-party-performance',
          type: 'chart',
          title: 'Party Performance Changes',
          order: 4,
          config: { chartType: 'bar', chartDataSource: 'partyPerformance', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-swings',
          type: 'chart',
          title: 'Constituency Swing Analysis',
          order: 5,
          config: { chartType: 'scatter', chartDataSource: 'constituencySwings', chartOptions: {} },
          isVisible: true,
        },
        {
          id: 'sec-flipped',
          type: 'table',
          title: 'Flipped Constituencies',
          order: 6,
          config: {
            columns: ['constituency', 'previousWinner', 'currentWinner', 'margin'],
            tableDataSource: 'flippedConstituencies',
          },
          isVisible: true,
        },
      ],
      defaultBranding: {
        colors: {
          primary: '#dc2626',
          secondary: '#64748b',
          accent: '#ef4444',
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial',
        },
      },
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(executiveSummaryTemplate.id, executiveSummaryTemplate);
    this.templates.set(constituencyReportTemplate.id, constituencyReportTemplate);
    this.templates.set(analyticsReportTemplate.id, analyticsReportTemplate);
    this.templates.set(comparisonReportTemplate.id, comparisonReportTemplate);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): ReportTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: string): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  /**
   * Get default templates
   */
  getDefaultTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.isDefault);
  }

  /**
   * Create custom template
   */
  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<ReportTemplate>): ReportTemplate | null {
    const existing = this.templates.get(id);
    if (!existing) return null;

    const updated: ReportTemplate = {
      ...existing,
      ...updates,
      id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): boolean {
    if (this.templates.get(id)?.isDefault) {
      throw new Error('Cannot delete default templates');
    }
    return this.templates.delete(id);
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(id: string): ReportTemplate | null {
    const original = this.templates.get(id);
    if (!original) return null;

    const duplicate: ReportTemplate = {
      ...original,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(duplicate.id, duplicate);
    return duplicate;
  }

  /**
   * Add section to template
   */
  addSection(templateId: string, section: Omit<ReportSection, 'id'>): ReportSection | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const newSection: ReportSection = {
      ...section,
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    template.sections.push(newSection);
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    return newSection;
  }

  /**
   * Remove section from template
   */
  removeSection(templateId: string, sectionId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const index = template.sections.findIndex(s => s.id === sectionId);
    if (index === -1) return false;

    template.sections.splice(index, 1);
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    return true;
  }

  /**
   * Update section in template
   */
  updateSection(templateId: string, sectionId: string, updates: Partial<ReportSection>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return false;

    Object.assign(section, updates);
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    return true;
  }

  /**
   * Reorder sections in template
   */
  reorderSections(templateId: string, sectionOrder: string[]): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const sectionMap = new Map(template.sections.map(s => [s.id, s]));
    const reorderedSections: ReportSection[] = [];

    for (const sectionId of sectionOrder) {
      const section = sectionMap.get(sectionId);
      if (section) {
        reorderedSections.push(section);
        sectionMap.delete(sectionId);
      }
    }

    // Add any remaining sections at the end
    for (const section of sectionMap.values()) {
      reorderedSections.push(section);
    }

    // Update order
    reorderedSections.forEach((section, index) => {
      section.order = index;
    });

    template.sections = reorderedSections;
    template.updatedAt = new Date();
    this.templates.set(templateId, template);

    return true;
  }

  /**
   * Validate template
   */
  validateTemplate(template: ReportTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.type || !['executive_summary', 'constituency_report', 'analytics_report', 'comparison_report', 'custom'].includes(template.type)) {
      errors.push('Invalid template type');
    }

    if (!template.sections || template.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    // Validate sections
    template.sections.forEach((section, index) => {
      if (!section.type) {
        errors.push(`Section ${index + 1}: type is required`);
      }
      if (!section.title) {
        errors.push(`Section ${index + 1}: title is required`);
      }
      if (typeof section.order !== 'number') {
        errors.push(`Section ${index + 1}: order must be a number`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Preview template
   */
  previewTemplate(templateId: string, _sampleData: any): any {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return {
      template,
      preview: this.generatePreview(template),
    };
  }

  /**
   * Generate preview
   */
  private generatePreview(template: ReportTemplate): any {
    const preview: any = {
      title: template.name,
      sections: [],
    };

    const sortedSections = template.sections.sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      const sectionPreview: any = {
        title: section.title,
        type: section.type,
        isVisible: section.isVisible,
      };

      // Add sample content based on type
      switch (section.type) {
        case 'text':
          sectionPreview.content = section.config.content || 'Sample text content';
          break;
        case 'chart':
          sectionPreview.chartType = section.config.chartType || 'bar';
          sectionPreview.dataSource = section.config.chartDataSource || 'sampleData';
          break;
        case 'table':
          sectionPreview.columns = section.config.columns || ['Column 1', 'Column 2'];
          sectionPreview.dataSource = section.config.tableDataSource || 'sampleData';
          break;
        case 'summary':
          sectionPreview.summaryType = section.config.summaryType || 'key_findings';
          break;
      }

      preview.sections.push(sectionPreview);
    }

    return preview;
  }
}

// Singleton instance
let reportTemplateService: ReportTemplateService | null = null;

export function getReportTemplateService(): ReportTemplateService {
  if (!reportTemplateService) {
    reportTemplateService = new ReportTemplateService();
  }
  return reportTemplateService;
}
