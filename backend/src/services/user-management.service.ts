import { BaseService } from './base.service';
import { AdminUser, UserManagementRequest, UserUpdateRequest, Permission } from '../types/admin.schema';
import { UserRole } from '../types';
import { getUserPermissions } from '../middleware/rbac.middleware';

export class UserManagementService extends BaseService {
  // In-memory storage (in production, use database)
  private users: Map<string, AdminUser> = new Map();

  constructor() {
    super();
    this.initializeDefaultUsers();
  }

  /**
   * Initialize default users
   */
  private initializeDefaultUsers(): void {
    const defaultUsers: AdminUser[] = [
      {
        id: 'user-1',
        email: 'admin@votelens.ai',
        name: 'System Administrator',
        role: UserRole.ADMIN,
        permissions: this.convertPermissions(getUserPermissions(UserRole.ADMIN)),
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        metadata: {
          department: 'IT',
          location: 'HQ',
        },
      },
      {
        id: 'user-2',
        email: 'analyst@votelens.ai',
        name: 'Senior Analyst',
        role: UserRole.ANALYST,
        permissions: this.convertPermissions(getUserPermissions(UserRole.ANALYST)),
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        metadata: {
          department: 'Analytics',
          location: 'HQ',
        },
      },
      {
        id: 'user-3',
        email: 'user@votelens.ai',
        name: 'Regular User',
        role: UserRole.USER,
        permissions: this.convertPermissions(getUserPermissions(UserRole.USER)),
        status: 'active',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      },
    ];

    defaultUsers.forEach(user => this.users.set(user.id, user));
  }

  /**
   * Convert permission strings to Permission objects
   */
  private convertPermissions(permissionStrings: string[]): Permission[] {
    return permissionStrings.map(id => ({
      id,
      name: id,
      resource: id.split('.')[0],
      action: id.split('.')[1] || '*',
      description: `Permission for ${id}`,
      category: 'system',
    }));
  }

  /**
   * Create a new user
   */
  async createUser(request: UserManagementRequest, createdBy: string): Promise<AdminUser> {
    const existingUser = Array.from(this.users.values()).find(u => u.email === request.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const permissions = request.permissions
      ? this.getPermissionsByIds(request.permissions)
      : this.convertPermissions(getUserPermissions(request.role));

    const newUser: AdminUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: request.email,
      name: request.name,
      role: request.role,
      permissions,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      metadata: request.metadata,
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): AdminUser | null {
    return this.users.get(id) || null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): AdminUser | null {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  /**
   * Get all users
   */
  getAllUsers(filters?: {
    role?: UserRole;
    status?: 'active' | 'suspended' | 'pending' | 'deleted';
  }): AdminUser[] {
    let users = Array.from(this.users.values());

    if (filters?.role) {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters?.status) {
      users = users.filter(u => u.status === filters.status);
    }

    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: UserUpdateRequest): Promise<AdminUser | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: AdminUser = {
      ...user,
      ...updates,
      permissions: updates.permissions
        ? this.getPermissionsByIds(updates.permissions)
        : user.permissions,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete user
   */
  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    // Soft delete
    const deletedUser: AdminUser = {
      ...user,
      status: 'deleted',
      updatedAt: new Date(),
    };

    this.users.set(id, deletedUser);
    return true;
  }

  /**
   * Suspend user
   */
  suspendUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    user.status = 'suspended';
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  /**
   * Activate user
   */
  activateUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    user.status = 'active';
    user.updatedAt = new Date();
    this.users.set(id, user);
    return true;
  }

  /**
   * Update last login
   */
  updateLastLogin(id: string): void {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(id, user);
    }
  }

  /**
   * Get user statistics
   */
  getUserStatistics(): {
    total: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<string, number>;
    active: number;
    suspended: number;
    pending: number;
  } {
    const users = Array.from(this.users.values());

    const byRole: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.ANALYST]: 0,
      [UserRole.USER]: 0,
      [UserRole.GUEST]: 0,
    };

    const byStatus: Record<string, number> = {};

    users.forEach(user => {
      byRole[user.role]++;
      byStatus[user.status] = (byStatus[user.status] || 0) + 1;
    });

    return {
      total: users.length,
      byRole,
      byStatus,
      active: byStatus.active || 0,
      suspended: byStatus.suspended || 0,
      pending: byStatus.pending || 0,
    };
  }

  /**
   * Search users
   */
  searchUsers(query: string): AdminUser[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get permissions by IDs
   */
  private getPermissionsByIds(permissionIds: string[]): Permission[] {
    // In production, this would query the permissions table
    // For now, we'll return mock permissions
    return permissionIds.map(id => ({
      id,
      name: id,
      resource: id.split('.')[0],
      action: id.split('.')[1] || '*',
      description: `Permission for ${id}`,
      category: 'system',
    }));
  }

  /**
   * Validate user data
   */
  validateUserData(data: UserManagementRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!Object.values(UserRole).includes(data.role)) {
      errors.push('Invalid role');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Export users to CSV
   */
  exportUsersToCSV(): string {
    const users = this.getAllUsers();
    const headers = ['ID', 'Email', 'Name', 'Role', 'Status', 'Created At', 'Last Login'];
    const rows = users.map(user => [
      user.id,
      user.email,
      user.name,
      user.role,
      user.status,
      user.createdAt.toISOString(),
      user.lastLoginAt?.toISOString() || 'N/A',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId: string): {
    userId: string;
    loginCount: number;
    lastLogin: Date | null;
    accountAge: number;
    status: string;
  } {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const accountAge = Date.now() - user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

    return {
      userId,
      loginCount: Math.floor(Math.random() * 100) + 1, // Mock data
      lastLogin: user.lastLoginAt || null,
      accountAge: accountAgeDays,
      status: user.status,
    };
  }
}

// Singleton instance
let userManagementService: UserManagementService | null = null;

export function getUserManagementService(): UserManagementService {
  if (!userManagementService) {
    userManagementService = new UserManagementService();
  }
  return userManagementService;
}
