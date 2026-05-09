export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: Role;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: Plan;
  maxUsers: number;
  maxElections: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  displayName?: string;
  password?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  photoURL?: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  logo?: string;
  plan?: Plan;
}
