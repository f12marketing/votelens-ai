import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // User permissions
  USER_READ: 'users.read',
  USER_WRITE: 'users.write',
  USER_DELETE: 'users.delete',
  USER_MANAGE_ROLES: 'users.manage_roles',

  // Dataset permissions
  DATASET_READ: 'datasets.read',
  DATASET_WRITE: 'datasets.write',
  DATASET_DELETE: 'datasets.delete',
  DATASET_MODERATE: 'datasets.moderate',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_ADVANCED: 'analytics.advanced',

  // Report permissions
  REPORT_READ: 'reports.read',
  REPORT_WRITE: 'reports.write',
  REPORT_DELETE: 'reports.delete',

  // System permissions
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_MONITOR: 'system.monitor',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_HEALTH: 'system.health',

  // API permissions
  API_MANAGE: 'api.manage',
  API_MONITOR: 'api.monitor',
  API_KEYS: 'api.keys',
};

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    // All permissions
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.DATASET_READ,
    PERMISSIONS.DATASET_WRITE,
    PERMISSIONS.DATASET_DELETE,
    PERMISSIONS.DATASET_MODERATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_WRITE,
    PERMISSIONS.REPORT_DELETE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_MONITOR,
    PERMISSIONS.SYSTEM_LOGS,
    PERMISSIONS.SYSTEM_HEALTH,
    PERMISSIONS.API_MANAGE,
    PERMISSIONS.API_MONITOR,
    PERMISSIONS.API_KEYS,
  ],
  [UserRole.ANALYST]: [
    PERMISSIONS.DATASET_READ,
    PERMISSIONS.DATASET_WRITE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_WRITE,
    PERMISSIONS.SYSTEM_MONITOR,
  ],
  [UserRole.USER]: [
    PERMISSIONS.DATASET_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORT_READ,
  ],
  [UserRole.GUEST]: [
    PERMISSIONS.DATASET_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: UserRole, requiredPermission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userRole: UserRole, requiredPermissions: string[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.some(perm => rolePermissions.includes(perm));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userRole: UserRole, requiredPermissions: string[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.every(perm => rolePermissions.includes(perm));
}

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Permission required: ${permission}`,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the required permissions
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasAnyPermission(user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `One of these permissions required: ${permissions.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has all required permissions
 */
export function requireAllPermissions(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!hasAllPermissions(user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `All these permissions required: ${permissions.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  next();
}

/**
 * Middleware to check if user is admin or analyst
 */
export function requireAnalystOrAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.ANALYST) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Analyst or Admin access required',
    });
  }

  next();
}

/**
 * Get user permissions
 */
export function getUserPermissions(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check resource ownership (for user-specific resources)
 */
export function requireOwnershipOrAdmin(userIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Admins can access any resource
    if (user.role === UserRole.ADMIN) {
      return next();
    }

    // Users can only access their own resources
    if (resourceUserId && resourceUserId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You can only access your own resources',
      });
    }

    next();
  };
}
