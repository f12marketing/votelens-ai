import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { getUserManagementService } from '../services/user-management.service';
import { getRoleManagementService } from '../services/role-management.service';
import { getDatasetModerationService } from '../services/dataset-moderation.service';
import { getAuditLogService } from '../services/audit-log.service';
import { getMonitoringService } from '../services/monitoring.service';
import {
  UserManagementRequest,
  UserUpdateRequest,
  RoleManagementRequest,
  ModerationRequest,
  MonitoringQuery,
  AuditLogQuery,
} from '../types/admin.schema';

export class AdminController extends BaseController {
  private userManagementService = getUserManagementService();
  private roleManagementService = getRoleManagementService();
  private datasetModerationService = getDatasetModerationService();
  private auditLogService = getAuditLogService();
  private monitoringService = getMonitoringService();

  // ==================== User Management ====================

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, status } = req.query;
      const users = this.userManagementService.getAllUsers({
        role: role as any,
        status: status as any,
      });
      this.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = this.userManagementService.getUserById(id);
      if (!user) {
        return this.error(res, 'NOT_FOUND', 'User not found', 404);
      }
      this.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const request: UserManagementRequest = req.body;
      const createdBy = (req as any).user?.id;

      const validation = this.userManagementService.validateUserData(request);
      if (!validation.valid) {
        return this.error(res, 'INVALID_DATA', validation.errors.join(', '), 400);
      }

      const user = await this.userManagementService.createUser(request, createdBy);
      this.auditLogService.logUserAction(createdBy, 'user.created', 'users', user.id, { name: user.name, email: user.email });
      this.success(res, user, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates: UserUpdateRequest = req.body;

      const user = await this.userManagementService.updateUser(id, updates);
      if (!user) {
        return this.error(res, 'NOT_FOUND', 'User not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'user.updated', 'users', id, updates);
      this.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = this.userManagementService.deleteUser(id);
      if (!success) {
        return this.error(res, 'NOT_FOUND', 'User not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'user.deleted', 'users', id);
      this.success(res, { message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = this.userManagementService.suspendUser(id);
      if (!success) {
        return this.error(res, 'NOT_FOUND', 'User not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'user.suspended', 'users', id);
      this.success(res, { message: 'User suspended successfully' });
    } catch (error) {
      next(error);
    }
  }

  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = this.userManagementService.activateUser(id);
      if (!success) {
        return this.error(res, 'NOT_FOUND', 'User not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'user.activated', 'users', id);
      this.success(res, { message: 'User activated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getUserStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = this.userManagementService.getUserStatistics();
      this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q) {
        return this.error(res, 'INVALID_QUERY', 'Search query is required', 400);
      }
      const users = this.userManagementService.searchUsers(String(q));
      this.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  // ==================== Role Management ====================

  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { includeSystem } = req.query;
      const roles = this.roleManagementService.getAllRoles(includeSystem === 'true');
      this.success(res, roles);
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = this.roleManagementService.getRoleById(id);
      if (!role) {
        return this.error(res, 'NOT_FOUND', 'Role not found', 404);
      }
      this.success(res, role);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const request: RoleManagementRequest = req.body;

      const validation = this.roleManagementService.validateRoleData(request);
      if (!validation.valid) {
        return this.error(res, 'INVALID_DATA', validation.errors.join(', '), 400);
      }

      const role = await this.roleManagementService.createRole(request);
      this.auditLogService.logUserAction((req as any).user?.id, 'role.created', 'roles', role.id, { name: role.name });
      this.success(res, role, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const role = await this.roleManagementService.updateRole(id, updates);
      if (!role) {
        return this.error(res, 'NOT_FOUND', 'Role not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'role.updated', 'roles', id, updates);
      this.success(res, role);
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = this.roleManagementService.deleteRole(id);
      if (!success) {
        return this.error(res, 'NOT_FOUND', 'Role not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'role.deleted', 'roles', id);
      this.success(res, { message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async duplicateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = this.roleManagementService.duplicateRole(id);
      if (!role) {
        return this.error(res, 'NOT_FOUND', 'Role not found', 404);
      }

      this.auditLogService.logUserAction((req as any).user?.id, 'role.duplicated', 'roles', role.id, { originalId: id });
      this.success(res, role, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = this.roleManagementService.getAllAvailablePermissions();
      this.success(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  async getPermissionsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const permissions = this.roleManagementService.getPermissionsByCategory(category as any);
      this.success(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  async getRoleStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = this.roleManagementService.getRoleStatistics();
      this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== Dataset Moderation ====================

  async getAllModerations(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, uploadedBy } = req.query;
      const moderations = this.datasetModerationService.getAllModerations({
        status: status as any,
        moderationType: type as any,
        uploadedBy: String(uploadedBy),
      });
      this.success(res, moderations);
    } catch (error) {
      next(error);
    }
  }

  async getModerationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const moderation = this.datasetModerationService.getModerationById(id);
      if (!moderation) {
        return this.error(res, 'NOT_FOUND', 'Moderation not found', 404);
      }
      this.success(res, moderation);
    } catch (error) {
      next(error);
    }
  }

  async reviewModeration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const request: ModerationRequest = req.body;
      const reviewedBy = (req as any).user?.id;

      const moderation = await this.datasetModerationService.reviewModeration(id, request, reviewedBy);
      if (!moderation) {
        return this.error(res, 'NOT_FOUND', 'Moderation not found', 404);
      }

      this.auditLogService.logUserAction(reviewedBy, 'moderation.reviewed', 'moderations', id, { status: request.status });
      this.success(res, moderation);
    } catch (error) {
      next(error);
    }
  }

  async approveModeration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewedBy = (req as any).user?.id;

      const moderation = await this.datasetModerationService.approveModeration(id, reviewNotes, reviewedBy);
      if (!moderation) {
        return this.error(res, 'NOT_FOUND', 'Moderation not found', 404);
      }

      this.auditLogService.logUserAction(reviewedBy, 'moderation.approved', 'moderations', id);
      this.success(res, moderation);
    } catch (error) {
      next(error);
    }
  }

  async rejectModeration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewedBy = (req as any).user?.id;

      const moderation = await this.datasetModerationService.rejectModeration(id, reviewNotes, reviewedBy);
      if (!moderation) {
        return this.error(res, 'NOT_FOUND', 'Moderation not found', 404);
      }

      this.auditLogService.logUserAction(reviewedBy, 'moderation.rejected', 'moderations', id);
      this.success(res, moderation);
    } catch (error) {
      next(error);
    }
  }

  async getModerationStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = this.datasetModerationService.getModerationStatistics();
      this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getPendingModerations(req: Request, res: Response, next: NextFunction) {
    try {
      const moderations = this.datasetModerationService.getPendingModerations();
      this.success(res, moderations);
    } catch (error) {
      next(error);
    }
  }

  async getFlaggedModerations(req: Request, res: Response, next: NextFunction) {
    try {
      const moderations = this.datasetModerationService.getFlaggedModerations();
      this.success(res, moderations);
    } catch (error) {
      next(error);
    }
  }

  async getModerationTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const trends = this.datasetModerationService.getModerationTrends(Number(days) || 30);
      this.success(res, trends);
    } catch (error) {
      next(error);
    }
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query: AuditLogQuery = req.query;
      const result = this.auditLogService.getLogs(query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = this.auditLogService.getLogById(id);
      if (!log) {
        return this.error(res, 'NOT_FOUND', 'Audit log not found', 404);
      }
      this.success(res, log);
    } catch (error) {
      next(error);
    }
  }

  async getLogsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const logs = this.auditLogService.getLogsByUser(userId, Number(limit) || 100);
      this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getLogsByResource(req: Request, res: Response, next: NextFunction) {
    try {
      const { resource } = req.params;
      const { limit } = req.query;
      const logs = this.auditLogService.getLogsByResource(resource, Number(limit) || 100);
      this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getRecentLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const logs = this.auditLogService.getRecentLogs(Number(limit) || 50);
      this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getCriticalLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const logs = this.auditLogService.getCriticalLogs(Number(limit) || 50);
      this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getLogStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = this.auditLogService.getLogStatistics();
      this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getLogTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const trends = this.auditLogService.getLogTrends(Number(days) || 30);
      this.success(res, trends);
    } catch (error) {
      next(error);
    }
  }

  async searchLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q) {
        return this.error(res, 'INVALID_QUERY', 'Search query is required', 400);
      }
      const logs = this.auditLogService.searchLogs(String(q));
      this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query: AuditLogQuery = req.query;
      const csv = this.auditLogService.exportLogsToCSV(query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async detectAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const anomalies = this.auditLogService.detectAnomalies();
      this.success(res, anomalies);
    } catch (error) {
      next(error);
    }
  }

  // ==================== Monitoring ====================

  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await this.monitoringService.getSystemHealth();
      this.success(res, health);
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      const dashboard = await this.monitoringService.getAnalyticsDashboard(
        period as 'hourly' | 'daily' | 'weekly' | 'monthly',
        new Date(String(startDate)),
        new Date(String(endDate))
      );
      this.success(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  async getAIUsageMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const query: MonitoringQuery = req.query;
      const metrics = this.monitoringService.getAIUsageMetrics(query);
      this.success(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async getAPIUsageMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const query: MonitoringQuery = req.query;
      const metrics = this.monitoringService.getAPIUsageMetrics(query);
      this.success(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await this.monitoringService.getSystemHealth();
      const stats = this.auditLogService.getLogStatistics();
      const userStats = this.userManagementService.getUserStatistics();
      const moderationStats = this.datasetModerationService.getModerationStatistics();

      this.success(res, {
        status: 'healthy',
        system: health,
        logs: stats,
        users: userStats,
        moderations: moderationStats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
