import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { reportService } from '../services/report.service';
import { getPDFReportGeneratorService } from '../services/pdf-report-generator.service';
import { getCSVExportService } from '../services/csv-export.service';
import { getChartExportService } from '../services/chart-export.service';
import { getExecutiveSummaryAIService } from '../services/executive-summary-ai.service';
import { getReportTemplateService } from '../services/report-template.service';
import { CreateReportDto, GetReportsDto } from '../dto/report.dto';
import { ExportRequest, ChartExportConfig } from '../types/report.schema';

export class ReportController extends BaseController {
  private pdfService = getPDFReportGeneratorService();
  private csvService = getCSVExportService();
  private chartService = getChartExportService();
  private aiService = getExecutiveSummaryAIService();
  private templateService = getReportTemplateService();

  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const dto: CreateReportDto = req.body;
      const report = await reportService.createReport(userId, dto);
      this.success(res, report, 201);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const query = req.query as GetReportsDto;
      const result = await reportService.getReports(userId, query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);
      this.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  async downloadReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await reportService.downloadReport(id);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { id } = req.params;
      await reportService.deleteReport(id, userId);
      this.success(res, { message: 'Report deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(req: Request, res: Response, next: NextFunction) {
    try {
      const request: ExportRequest = req.body;
      const template = request.template || this.templateService.getTemplateById('template-executive');
      
      if (!template) {
        return this.error(res, 'TEMPLATE_NOT_FOUND', 'Template not found', 404);
      }

      const result = await this.pdfService.generatePDFReport(
        request.reportConfig,
        request.data,
        template,
        {
          includeCoverPage: true,
          includeTableOfContents: true,
          includePageNumbers: true,
          includeFooter: true,
          compression: 'medium',
        }
      );

      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate CSV export
   */
  async generateCSVExport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportConfig, data } = req.body;
      const result = await this.csvService.generateCSVExport(reportConfig, data);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate constituency CSV
   */
  async generateConstituencyCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { constituencyData, reportConfig } = req.body;
      const result = await this.csvService.generateConstituencyCSV(constituencyData, reportConfig);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate analytics CSV
   */
  async generateAnalyticsCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { analyticsData, reportConfig } = req.body;
      const result = await this.csvService.generateAnalyticsCSV(analyticsData, reportConfig);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export chart as PNG
   */
  async exportChartAsPNG(req: Request, res: Response, next: NextFunction) {
    try {
      const config: ChartExportConfig = req.body;
      const chartData = req.body.chartData;

      const validation = this.chartService.validateConfig(config);
      if (!validation.valid) {
        return this.error(res, 'INVALID_CONFIG', validation.errors.join(', '), 400);
      }

      const result = await this.chartService.exportChartAsPNG(config, chartData);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export chart as SVG
   */
  async exportChartAsSVG(req: Request, res: Response, next: NextFunction) {
    try {
      const config: ChartExportConfig = req.body;
      const chartData = req.body.chartData;

      const validation = this.chartService.validateConfig(config);
      if (!validation.valid) {
        return this.error(res, 'INVALID_CONFIG', validation.errors.join(', '), 400);
      }

      const result = await this.chartService.exportChartAsSVG(config, chartData);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export chart as PDF
   */
  async exportChartAsPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const config: ChartExportConfig = req.body;
      const chartData = req.body.chartData;

      const validation = this.chartService.validateConfig(config);
      if (!validation.valid) {
        return this.error(res, 'INVALID_CONFIG', validation.errors.join(', '), 400);
      }

      const result = await this.chartService.exportChartAsPDF(config, chartData);
      return this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch export charts
   */
  async batchExportCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const { configs, chartDataMap } = req.body;
      const results = await this.chartService.batchExportCharts(configs, new Map(Object.entries(chartDataMap)));
      return this.success(res, { results }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI executive summary
   */
  async generateExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.body;
      const summary = await this.aiService.generateExecutiveSummary(data);
      return this.success(res, summary, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI key findings
   */
  async generateKeyFindings(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.body;
      const findings = await this.aiService.generateKeyFindings(data);
      return this.success(res, findings, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AI recommendations
   */
  async generateRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.body;
      const recommendations = await this.aiService.generateRecommendations(data);
      return this.success(res, recommendations, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all report templates
   */
  async getTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = this.templateService.getAllTemplates();
      return this.success(res, templates, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = this.templateService.getTemplateById(id);
      if (!template) {
        return this.error(res, 'NOT_FOUND', 'Template not found', 404);
      }
      return this.success(res, template, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const templates = this.templateService.getTemplatesByType(type);
      return this.success(res, templates, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create custom template
   */
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const templateData = req.body;
      const validation = this.templateService.validateTemplate(templateData);
      if (!validation.valid) {
        return this.error(res, 'INVALID_TEMPLATE', validation.errors.join(', '), 400);
      }
      const template = this.templateService.createTemplate(templateData);
      return this.success(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const template = this.templateService.updateTemplate(id, updates);
      if (!template) {
        return this.error(res, 'NOT_FOUND', 'Template not found', 404);
      }
      return this.success(res, template, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = this.templateService.deleteTemplate(id);
      if (!success) {
        return this.error(res, 'NOT_FOUND', 'Template not found', 404);
      }
      return this.success(res, { message: 'Template deleted successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = this.templateService.duplicateTemplate(id);
      if (!template) {
        return this.error(res, 'NOT_FOUND', 'Template not found', 404);
      }
      return this.success(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported chart formats
   */
  async getSupportedChartFormats(_req: Request, res: Response, next: NextFunction) {
    try {
      const formats = this.chartService.getSupportedFormats();
      return this.success(res, formats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get CSV export templates
   */
  async getCSVExportTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = this.csvService.getCSVExportTemplates();
      return this.success(res, templates, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(_req: Request, res: Response, next: NextFunction) {
    try {
      const aiHealth = await this.aiService.healthCheck();
      return this.success(res, {
        status: 'healthy',
        services: {
          pdf: 'healthy',
          csv: 'healthy',
          chart: 'healthy',
          ai: aiHealth,
          templates: 'healthy',
        },
      }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
