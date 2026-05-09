export const ROLE_PERMISSIONS = {
  USER: [
    'elections:read',
    'elections:create',
    'elections:update:own',
    'elections:delete:own',
    'constituencies:read',
    'analytics:read',
    'insights:read',
    'insights:generate',
    'maps:read',
    'query:execute',
  ],
  ADMIN: [
    'elections:read',
    'elections:create',
    'elections:update:any',
    'elections:delete:own',
    'constituencies:read',
    'constituencies:create',
    'constituencies:update',
    'constituencies:delete',
    'analytics:read',
    'analytics:export',
    'insights:read',
    'insights:generate',
    'insights:approve',
    'maps:read',
    'query:execute',
    'organizations:read',
    'organizations:create',
    'users:read',
  ],
  SUPER_ADMIN: [
    'elections:*',
    'constituencies:*',
    'analytics:*',
    'insights:*',
    'maps:*',
    'query:*',
    'organizations:*',
    'users:*',
    'system:*',
  ],
} as const;

export const PERMISSIONS = {
  ELECTIONS_READ: 'elections:read',
  ELECTIONS_CREATE: 'elections:create',
  ELECTIONS_UPDATE_OWN: 'elections:update:own',
  ELECTIONS_UPDATE_ANY: 'elections:update:any',
  ELECTIONS_DELETE_OWN: 'elections:delete:own',
  ELECTIONS_DELETE_ANY: 'elections:delete:any',

  CONSTITUENCIES_READ: 'constituencies:read',
  CONSTITUENCIES_CREATE: 'constituencies:create',
  CONSTITUENCIES_UPDATE: 'constituencies:update',
  CONSTITUENCIES_DELETE: 'constituencies:delete',

  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  INSIGHTS_READ: 'insights:read',
  INSIGHTS_GENERATE: 'insights:generate',
  INSIGHTS_APPROVE: 'insights:approve',

  MAPS_READ: 'maps:read',

  QUERY_EXECUTE: 'query:execute',

  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_CREATE: 'organizations:create',

  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',

  SYSTEM_MANAGE: 'system:*',
} as const;

export const ROLE_HIERARCHY = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
} as const;
