import { BaseService } from './base.service';
import { DatasetModeration, ModerationFlag, ModerationRequest } from '../types/admin.schema';

export class DatasetModerationService extends BaseService {
  // In-memory storage (in production, use database)
  private moderations: Map<string, DatasetModeration> = new Map();

  constructor() {
    super();
    this.initializeMockData();
  }

  /**
   * Initialize mock moderation data
   */
  private initializeMockData(): void {
    const mockModerations: DatasetModeration[] = [
      {
        id: 'mod-1',
        datasetId: 'ds-1',
        datasetName: 'Election Data 2024',
        uploadedBy: 'user-3',
        uploadedAt: new Date('2024-03-01'),
        status: 'pending',
        moderationType: 'quality',
        flags: [
          {
            id: 'flag-1',
            type: 'data_quality',
            severity: 'medium',
            message: 'Missing values detected in turnout column',
            field: 'turnout',
          },
        ],
        metadata: {
          fileSize: 2.5 * 1024 * 1024,
          recordCount: 5000,
          fileFormat: 'csv',
        },
      },
      {
        id: 'mod-2',
        datasetId: 'ds-2',
        datasetName: 'Constituency Boundaries',
        uploadedBy: 'user-2',
        uploadedAt: new Date('2024-03-05'),
        status: 'approved',
        moderationType: 'compliance',
        flags: [],
        reviewedBy: 'user-1',
        reviewedAt: new Date('2024-03-06'),
        reviewNotes: 'Dataset meets all compliance requirements',
        metadata: {
          fileSize: 5.1 * 1024 * 1024,
          recordCount: 250,
          fileFormat: 'geojson',
        },
      },
      {
        id: 'mod-3',
        datasetId: 'ds-3',
        datasetName: 'Historical Election Results',
        uploadedBy: 'user-3',
        uploadedAt: new Date('2024-03-10'),
        status: 'flagged',
        moderationType: 'security',
        flags: [
          {
            id: 'flag-2',
            type: 'security',
            severity: 'high',
            message: 'Potential PII detected in dataset',
            field: 'voter_names',
          },
          {
            id: 'flag-3',
            type: 'compliance',
            severity: 'medium',
            message: 'Data source not properly documented',
          },
        ],
        reviewedBy: 'user-1',
        reviewedAt: new Date('2024-03-11'),
        reviewNotes: 'Requires data sanitization before approval',
        metadata: {
          fileSize: 10.2 * 1024 * 1024,
          recordCount: 15000,
          fileFormat: 'csv',
        },
      },
    ];

    mockModerations.forEach(mod => this.moderations.set(mod.id, mod));
  }

  /**
   * Create moderation record for dataset
   */
  async createModeration(
    datasetId: string,
    datasetName: string,
    uploadedBy: string,
    moderationType: 'content' | 'quality' | 'compliance' | 'security',
    metadata?: { fileSize: number; recordCount: number; fileFormat: string }
  ): Promise<DatasetModeration> {
    const moderation: DatasetModeration = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      datasetId,
      datasetName,
      uploadedBy,
      uploadedAt: new Date(),
      status: 'pending',
      moderationType,
      flags: await this.analyzeDataset(datasetId, moderationType),
      metadata,
    };

    this.moderations.set(moderation.id, moderation);
    return moderation;
  }

  /**
   * Analyze dataset for moderation flags
   */
  private async analyzeDataset(
    _datasetId: string,
    moderationType: 'content' | 'quality' | 'compliance' | 'security'
  ): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    // Simulate analysis based on moderation type
    if (moderationType === 'quality') {
      if (Math.random() > 0.5) {
        flags.push({
          id: `flag-${Date.now()}-1`,
          type: 'data_quality',
          severity: 'medium',
          message: 'Missing values detected in dataset',
        });
      }
      if (Math.random() > 0.7) {
        flags.push({
          id: `flag-${Date.now()}-2`,
          type: 'format',
          severity: 'low',
          message: 'Inconsistent date format detected',
        });
      }
    }

    if (moderationType === 'security') {
      if (Math.random() > 0.6) {
        flags.push({
          id: `flag-${Date.now()}-3`,
          type: 'security',
          severity: 'high',
          message: 'Potential PII detected in dataset',
        });
      }
    }

    if (moderationType === 'compliance') {
      if (Math.random() > 0.8) {
        flags.push({
          id: `flag-${Date.now()}-4`,
          type: 'compliance',
          severity: 'medium',
          message: 'Data source not properly documented',
        });
      }
    }

    return flags;
  }

  /**
   * Get moderation by ID
   */
  getModerationById(id: string): DatasetModeration | null {
    return this.moderations.get(id) || null;
  }

  /**
   * Get moderation by dataset ID
   */
  getModerationByDatasetId(datasetId: string): DatasetModeration | null {
    return Array.from(this.moderations.values()).find(m => m.datasetId === datasetId) || null;
  }

  /**
   * Get all moderations
   */
  getAllModerations(filters?: {
    status?: 'pending' | 'approved' | 'rejected' | 'flagged';
    moderationType?: 'content' | 'quality' | 'compliance' | 'security';
    uploadedBy?: string;
  }): DatasetModeration[] {
    let moderations = Array.from(this.moderations.values());

    if (filters?.status) {
      moderations = moderations.filter(m => m.status === filters.status);
    }

    if (filters?.moderationType) {
      moderations = moderations.filter(m => m.moderationType === filters.moderationType);
    }

    if (filters?.uploadedBy) {
      moderations = moderations.filter(m => m.uploadedBy === filters.uploadedBy);
    }

    return moderations.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Review moderation
   */
  async reviewModeration(id: string, request: ModerationRequest, reviewedBy: string): Promise<DatasetModeration | null> {
    const moderation = this.moderations.get(id);
    if (!moderation) return null;

    const updatedModeration: DatasetModeration = {
      ...moderation,
      status: request.status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: request.reviewNotes,
    };

    this.moderations.set(id, updatedModeration);
    return updatedModeration;
  }

  /**
   * Approve moderation
   */
  async approveModeration(id: string, reviewNotes: string, reviewedBy: string): Promise<DatasetModeration | null> {
    return this.reviewModeration(id, { status: 'approved', reviewNotes }, reviewedBy);
  }

  /**
   * Reject moderation
   */
  async rejectModeration(id: string, reviewNotes: string, reviewedBy: string): Promise<DatasetModeration | null> {
    return this.reviewModeration(id, { status: 'rejected', reviewNotes }, reviewedBy);
  }

  /**
   * Flag moderation for review
   */
  async flagModeration(id: string, reviewNotes: string, reviewedBy: string): Promise<DatasetModeration | null> {
    return this.reviewModeration(id, { status: 'flagged', reviewNotes }, reviewedBy);
  }

  /**
   * Add flag to moderation
   */
  addFlag(moderationId: string, flag: Omit<ModerationFlag, 'id'>): boolean {
    const moderation = this.moderations.get(moderationId);
    if (!moderation) return false;

    const newFlag: ModerationFlag = {
      ...flag,
      id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    moderation.flags.push(newFlag);
    moderation.status = 'flagged';
    this.moderations.set(moderationId, moderation);
    return true;
  }

  /**
   * Remove flag from moderation
   */
  removeFlag(moderationId: string, flagId: string): boolean {
    const moderation = this.moderations.get(moderationId);
    if (!moderation) return false;

    const index = moderation.flags.findIndex(f => f.id === flagId);
    if (index === -1) return false;

    moderation.flags.splice(index, 1);

    // Update status if no critical flags remain
    const hasCriticalFlags = moderation.flags.some(f => f.severity === 'critical');
    if (!hasCriticalFlags && moderation.flags.length === 0) {
      moderation.status = 'pending';
    }

    this.moderations.set(moderationId, moderation);
    return true;
  }

  /**
   * Get moderation statistics
   */
  getModerationStatistics(): {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    averageFlags: number;
  } {
    const moderations = Array.from(this.moderations.values());

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    moderations.forEach(m => {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
      byType[m.moderationType] = (byType[m.moderationType] || 0) + 1;
    });

    const totalFlags = moderations.reduce((sum, m) => sum + m.flags.length, 0);
    const averageFlags = moderations.length > 0 ? totalFlags / moderations.length : 0;

    return {
      total: moderations.length,
      byStatus,
      byType,
      pending: byStatus.pending || 0,
      approved: byStatus.approved || 0,
      rejected: byStatus.rejected || 0,
      flagged: byStatus.flagged || 0,
      averageFlags,
    };
  }

  /**
   * Get pending moderations
   */
  getPendingModerations(): DatasetModeration[] {
    return this.getAllModerations({ status: 'pending' });
  }

  /**
   * Get flagged moderations
   */
  getFlaggedModerations(): DatasetModeration[] {
    return this.getAllModerations({ status: 'flagged' });
  }

  /**
   * Get moderations requiring attention
   */
  getModerationsRequiringAttention(): DatasetModeration[] {
    return Array.from(this.moderations.values())
      .filter(m => m.status === 'pending' || m.status === 'flagged')
      .filter(m => m.flags.some(f => f.severity === 'critical' || f.severity === 'high'))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Bulk review moderations
   */
  async bulkReview(
    moderationIds: string[],
    request: ModerationRequest,
    reviewedBy: string
  ): Promise<DatasetModeration[]> {
    const results: DatasetModeration[] = [];

    for (const id of moderationIds) {
      const result = await this.reviewModeration(id, request, reviewedBy);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get moderation trends
   */
  getModerationTrends(days: number = 30): Array<{
    date: Date;
    uploaded: number;
    reviewed: number;
    approved: number;
    rejected: number;
  }> {
    const trends: Array<{
      date: Date;
      uploaded: number;
      reviewed: number;
      approved: number;
      rejected: number;
    }> = [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const moderations = Array.from(this.moderations.values()).filter(
      m => m.uploadedAt >= cutoffDate
    );

    const byDate: Record<string, { uploaded: number; reviewed: number; approved: number; rejected: number }> = {};

    moderations.forEach(m => {
      const dateKey = m.uploadedAt.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { uploaded: 0, reviewed: 0, approved: 0, rejected: 0 };
      }
      byDate[dateKey].uploaded++;

      if (m.reviewedAt && m.reviewedAt >= cutoffDate) {
        const reviewDateKey = m.reviewedAt.toISOString().split('T')[0];
        if (!byDate[reviewDateKey]) {
          byDate[reviewDateKey] = { uploaded: 0, reviewed: 0, approved: 0, rejected: 0 };
        }
        byDate[reviewDateKey].reviewed++;
        if (m.status === 'approved') byDate[reviewDateKey].approved++;
        if (m.status === 'rejected') byDate[reviewDateKey].rejected++;
      }
    });

    Object.keys(byDate).forEach(dateStr => {
      trends.push({
        date: new Date(dateStr),
        uploaded: byDate[dateStr].uploaded,
        reviewed: byDate[dateStr].reviewed,
        approved: byDate[dateStr].approved,
        rejected: byDate[dateStr].rejected,
      });
    });

    return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Export moderations to CSV
   */
  exportModerationsToCSV(): string {
    const moderations = this.getAllModerations();
    const headers = ['ID', 'Dataset ID', 'Dataset Name', 'Uploaded By', 'Uploaded At', 'Status', 'Type', 'Flags Count', 'Reviewed By', 'Reviewed At'];
    const rows = moderations.map(m => [
      m.id,
      m.datasetId,
      m.datasetName,
      m.uploadedBy,
      m.uploadedAt.toISOString(),
      m.status,
      m.moderationType,
      m.flags.length,
      m.reviewedBy || 'N/A',
      m.reviewedAt?.toISOString() || 'N/A',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Auto-approve low-risk datasets
   */
  async autoApproveLowRisk(maxFlags: number = 2, maxSeverity: 'low' | 'medium' = 'medium'): Promise<number> {
    const pending = this.getPendingModerations();
    let approved = 0;

    for (const moderation of pending) {
      const hasOnlyLowRisk = moderation.flags.every(
        f => f.severity === 'low' || (maxSeverity === 'medium' && f.severity === 'medium')
      );
      const flagCount = moderation.flags.length;

      if (hasOnlyLowRisk && flagCount <= maxFlags) {
        await this.approveModeration(moderation.id, 'Auto-approved: Low risk', 'system');
        approved++;
      }
    }

    return approved;
  }
}

// Singleton instance
let datasetModerationService: DatasetModerationService | null = null;

export function getDatasetModerationService(): DatasetModerationService {
  if (!datasetModerationService) {
    datasetModerationService = new DatasetModerationService();
  }
  return datasetModerationService;
}
