export const RATE_LIMITS = {
  // General API limits
  GENERAL_REQUESTS_PER_HOUR: 1000,
  GENERAL_REQUESTS_PER_MINUTE: 100,

  // Query API limits
  QUERY_REQUESTS_PER_HOUR: 100,
  QUERY_REQUESTS_PER_MINUTE: 10,

  // Upload API limits
  UPLOAD_REQUESTS_PER_HOUR: 10,
  UPLOAD_REQUESTS_PER_MINUTE: 2,

  // Auth endpoints
  AUTH_REQUESTS_PER_MINUTE: 10,

  // Public endpoints
  PUBLIC_REQUESTS_PER_HOUR: 100,
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_UPLOAD_SIZE_PER_REQUEST: 10 * 1024 * 1024, // 10MB
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
  ],
} as const;

export const PLAN_LIMITS = {
  FREE: {
    maxUsers: 5,
    maxElections: 3,
    maxUploadsPerMonth: 10,
    maxAIQueriesPerMonth: 100,
    maxStorageGB: 5,
  },
  PRO: {
    maxUsers: 25,
    maxElections: 25,
    maxUploadsPerMonth: 100,
    maxAIQueriesPerMonth: 1000,
    maxStorageGB: 50,
  },
  ENTERPRISE: {
    maxUsers: -1, // Unlimited
    maxElections: -1, // Unlimited
    maxUploadsPerMonth: -1, // Unlimited
    maxAIQueriesPerMonth: -1, // Unlimited
    maxStorageGB: -1, // Unlimited
  },
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 600, // 10 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
} as const;
