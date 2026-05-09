import { BaseService } from './base.service';
import { Role, RoleManagementRequest, Permission } from '../types/admin.schema';
import { PERMISSIONS } from '../middleware/rbac.middleware';

export class RoleManagementService extends BaseService {
  // In-memory storage (in production, use database)
  private roles: Map<string, Role> = new Map();

  constructor() {
    super();
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'role-admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: this.getAllPermissions(),
        isSystemRole: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'role-analyst',
        name: 'Analyst',
        description: 'Analytics and reporting access',
        permissions: this.getAnalystPermissions(),
        isSystemRole: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'role-user',
        name: 'User',
        description: 'Basic read-only access',
        permissions: this.getUserPermissions(),
        isSystemRole: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
    ];

    defaultRoles.forEach(role => this.roles.set(role.id, role));
  }

  /**
   * Get all permissions
   */
  private getAllPermissions(): Permission[] {
    return Object.values(PERMISSIONS).map(perm => ({
      id: perm,
      name: perm,
      resource: perm.split('.')[0],
      action: perm.split('.')[1] || '*',
      description: `Permission for ${perm}`,
      category: this.getPermissionCategory(perm),
    }));
  }

  /**
   * Get analyst permissions
   */
  private getAnalystPermissions(): Permission[] {
    const analystPerms = [
      PERMISSIONS.DATASET_READ,
      PERMISSIONS.DATASET_WRITE,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.ANALYTICS_ADVANCED,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_WRITE,
      PERMISSIONS.SYSTEM_MONITOR,
    ];

    return analystPerms.map(perm => ({
      id: perm,
      name: perm,
      resource: perm.split('.')[0],
      action: perm.split('.')[1] || '*',
      description: `Permission for ${perm}`,
      category: this.getPermissionCategory(perm),
    }));
  }

  /**
   * Get user permissions
   */
  private getUserPermissions(): Permission[] {
    const userPerms = [
      PERMISSIONS.DATASET_READ,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REPORT_READ,
    ];

    return userPerms.map(perm => ({
      id: perm,
      name: perm,
      resource: perm.split('.')[0],
      action: perm.split('.')[1] || '*',
      description: `Permission for ${perm}`,
      category: this.getPermissionCategory(perm),
    }));
  }

  /**
   * Get permission category
   */
  private getPermissionCategory(permission: string): 'users' | 'datasets' | 'analytics' | 'reports' | 'system' | 'api' {
    const resource = permission.split('.')[0];
    const categoryMap: Record<string, 'users' | 'datasets' | 'analytics' | 'reports' | 'system' | 'api'> = {
      users: 'users',
      datasets: 'datasets',
      analytics: 'analytics',
      reports: 'reports',
      system: 'system',
      api: 'api',
    };

    return categoryMap[resource] || 'system';
  }

  /**
   * Create a new role
   */
  async createRole(request: RoleManagementRequest): Promise<Role> {
    const existingRole = Array.from(this.roles.values()).find(r => r.name === request.name);
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    const permissions = this.getPermissionsByIds(request.permissions);

    const newRole: Role = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: request.name,
      description: request.description,
      permissions,
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(newRole.id, newRole);
    return newRole;
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): Role | null {
    return this.roles.get(id) || null;
  }

  /**
   * Get role by name
   */
  getRoleByName(name: string): Role | null {
    return Array.from(this.roles.values()).find(r => r.name === name) || null;
  }

  /**
   * Get all roles
   */
  getAllRoles(includeSystemRoles: boolean = true): Role[] {
    let roles = Array.from(this.roles.values());

    if (!includeSystemRoles) {
      roles = roles.filter(r => !r.isSystemRole);
    }

    return roles.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update role
   */
  async updateRole(id: string, updates: Partial<RoleManagementRequest>): Promise<Role | null> {
    const role = this.roles.get(id);
    if (!role) return null;

    if (role.isSystemRole) {
      throw new Error('Cannot modify system roles');
    }

    const updatedRole: Role = {
      ...role,
      ...updates,
      permissions: updates.permissions
        ? this.getPermissionsByIds(updates.permissions)
        : role.permissions,
      updatedAt: new Date(),
    };

    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  /**
   * Delete role
   */
  deleteRole(id: string): boolean {
    const role = this.roles.get(id);
    if (!role) return false;

    if (role.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }

    return this.roles.delete(id);
  }

  /**
   * Duplicate role
   */
  duplicateRole(id: string): Role | null {
    const original = this.roles.get(id);
    if (!original) return null;

    const duplicate: Role = {
      ...original,
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(duplicate.id, duplicate);
    return duplicate;
  }

  /**
   * Get all available permissions
   */
  getAllAvailablePermissions(): Permission[] {
    return this.getAllPermissions();
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: 'users' | 'datasets' | 'analytics' | 'reports' | 'system' | 'api'): Permission[] {
    return this.getAllPermissions().filter(p => p.category === category);
  }

  /**
   * Get permissions by IDs
   */
  private getPermissionsByIds(permissionIds: string[]): Permission[] {
    const allPermissions = this.getAllPermissions();
    return permissionIds
      .map(id => allPermissions.find(p => p.id === id))
      .filter((p): p is Permission => p !== undefined);
  }

  /**
   * Validate role data
   */
  validateRoleData(data: RoleManagementRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Role name must be at least 2 characters');
    }

    if (!data.description || data.description.trim().length < 5) {
      errors.push('Description must be at least 5 characters');
    }

    if (!data.permissions || data.permissions.length === 0) {
      errors.push('Role must have at least one permission');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get role statistics
   */
  getRoleStatistics(): {
    total: number;
    system: number;
    custom: number;
    averagePermissions: number;
  } {
    const roles = Array.from(this.roles.values());

    const systemRoles = roles.filter(r => r.isSystemRole).length;
    const customRoles = roles.filter(r => !r.isSystemRole).length;
    const totalPermissions = roles.reduce((sum, r) => sum + r.permissions.length, 0);
    const averagePermissions = roles.length > 0 ? totalPermissions / roles.length : 0;

    return {
      total: roles.length,
      system: systemRoles,
      custom: customRoles,
      averagePermissions,
    };
  }

  /**
   * Compare two roles
   */
  compareRoles(roleId1: string, roleId2: string): {
    role1: Role | null;
    role2: Role | null;
    commonPermissions: Permission[];
    uniqueToRole1: Permission[];
    uniqueToRole2: Permission[];
  } {
    const role1 = this.roles.get(roleId1) || null;
    const role2 = this.roles.get(roleId2) || null;

    if (!role1 || !role2) {
      return {
        role1,
        role2,
        commonPermissions: [],
        uniqueToRole1: [],
        uniqueToRole2: [],
      };
    }

    const role1PermIds = new Set(role1.permissions.map(p => p.id));
    const role2PermIds = new Set(role2.permissions.map(p => p.id));

    const commonPermissions = role1.permissions.filter(p => role2PermIds.has(p.id));
    const uniqueToRole1 = role1.permissions.filter(p => !role2PermIds.has(p.id));
    const uniqueToRole2 = role2.permissions.filter(p => !role1PermIds.has(p.id));

    return {
      role1,
      role2,
      commonPermissions,
      uniqueToRole1,
      uniqueToRole2,
    };
  }

  /**
   * Export roles to CSV
   */
  exportRolesToCSV(): string {
    const roles = this.getAllRoles();
    const headers = ['ID', 'Name', 'Description', 'System Role', 'Permissions Count', 'Created At'];
    const rows = roles.map(role => [
      role.id,
      role.name,
      role.description,
      role.isSystemRole ? 'Yes' : 'No',
      role.permissions.length,
      role.createdAt.toISOString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let roleManagementService: RoleManagementService | null = null;

export function getRoleManagementService(): RoleManagementService {
  if (!roleManagementService) {
    roleManagementService = new RoleManagementService();
  }
  return roleManagementService;
}
