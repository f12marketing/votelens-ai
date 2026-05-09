import { UserRole } from "../../types/auth";

export function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

export function isAnalyst(user: any): boolean {
  return user?.role === "analyst" || user?.role === "admin";
}

export function hasRequiredRole(user: any, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

export function checkAdminAccess(user: any): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Not authenticated" };
  }
  
  if (!isAdmin(user)) {
    return { allowed: false, reason: "Insufficient permissions" };
  }
  
  return { allowed: true };
}

export function checkAnalystAccess(user: any): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Not authenticated" };
  }
  
  if (!isAnalyst(user)) {
    return { allowed: false, reason: "Insufficient permissions" };
  }
  
  return { allowed: true };
}
