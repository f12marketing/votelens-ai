export const ROUTES = {
  // Auth routes
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_ME: '/auth/me',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_HOME: '/dashboard',

  // Elections routes
  ELECTIONS: '/dashboard/elections',
  ELECTIONS_NEW: '/dashboard/elections/new',
  ELECTIONS_DETAILS: '/dashboard/elections/:id',
  ELECTIONS_EDIT: '/dashboard/elections/:id/edit',

  // Constituencies routes
  CONSTITUENCIES: '/dashboard/constituencies',
  CONSTITUENCIES_DETAILS: '/dashboard/constituencies/:id',

  // Analytics routes
  ANALYTICS: '/dashboard/analytics',

  // Insights routes
  INSIGHTS: '/dashboard/insights',

  // Maps routes
  MAPS: '/dashboard/maps',

  // Query routes
  QUERY: '/dashboard/query',

  // Settings routes
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ORGANIZATION: '/settings/organization',
  SETTINGS_API_KEYS: '/settings/api-keys',
} as const;

export const API_ROUTES = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password',
  AUTH_ME: '/api/v1/auth/me',

  // Elections
  ELECTIONS: '/api/v1/elections',
  ELECTIONS_DETAILS: (id: string) => `/api/v1/elections/${id}`,
  ELECTIONS_UPLOAD: (id: string) => `/api/v1/elections/${id}/upload`,
  ELECTIONS_STATUS: (id: string) => `/api/v1/elections/${id}/status`,
  ELECTIONS_PROCESS: (id: string) => `/api/v1/elections/${id}/process`,

  // Constituencies
  CONSTITUENCIES: (electionId: string) => `/api/v1/elections/${electionId}/constituencies`,
  CONSTITUENCY_DETAILS: (id: string) => `/api/v1/constituencies/${id}`,
  CONSTITUENCY_RESULTS: (id: string) => `/api/v1/constituencies/${id}/results`,
  CONSTITUENCY_DEMOGRAPHICS: (id: string) => `/api/v1/constituencies/${id}/demographics`,
  CONSTITUENCY_HISTORY: (id: string) => `/api/v1/constituencies/${id}/history`,

  // Analytics
  ANALYTICS_OVERVIEW: '/api/v1/analytics/overview',
  ANALYTICS_TRENDS: '/api/v1/analytics/trends',
  ANALYTICS_COMPARISON: '/api/v1/analytics/comparison',
  ANALYTICS_TURNOUT: '/api/v1/analytics/turnout',
  ANALYTICS_DEMOGRAPHICS: '/api/v1/analytics/demographics',
  ANALYTICS_GEOGRAPHIC: '/api/v1/analytics/geographic',

  // Insights
  INSIGHTS: (electionId: string) => `/api/v1/elections/${electionId}/insights`,
  INSIGHTS_GENERATE: (electionId: string) => `/api/v1/elections/${electionId}/insights/generate`,
  INSIGHT_DETAILS: (id: string) => `/api/v1/insights/${id}`,
  INSIGHTS_TRENDING: '/api/v1/insights/trending',

  // Maps
  MAPS_ELECTION: (id: string) => `/api/v1/maps/elections/${id}`,
  MAPS_CONSTITUENCY: (id: string) => `/api/v1/maps/constituencies/${id}`,
  MAPS_GEOJSON: (id: string) => `/api/v1/maps/geojson/${id}`,
  MAPS_HEATMAP: (id: string) => `/api/v1/maps/heatmap/${id}`,

  // Query
  QUERY: '/api/v1/query',
  QUERY_HISTORY: '/api/v1/query/history',
  QUERY_SUGGESTIONS: '/api/v1/query/suggestions',
  QUERY_FEEDBACK: '/api/v1/query/feedback',

  // Upload
  UPLOAD_INITIATE: '/api/v1/upload/initiate',
  UPLOAD_CHUNK: '/api/v1/upload/chunk',
  UPLOAD_COMPLETE: '/api/v1/upload/complete',
  UPLOAD_STATUS: (id: string) => `/api/v1/upload/status/${id}`,

  // Organizations
  ORGANIZATIONS: '/api/v1/organizations',
  ORGANIZATION_DETAILS: (id: string) => `/api/v1/organizations/${id}`,
  ORGANIZATION_MEMBERS: (id: string) => `/api/v1/organizations/${id}/members`,
  ORGANIZATION_MEMBER: (orgId: string, userId: string) => `/api/v1/organizations/${orgId}/members/${userId}`,

  // Health
  HEALTH: '/api/v1/health',
  HEALTH_DB: '/api/v1/health/db',
  HEALTH_CACHE: '/api/v1/health/cache',
  METRICS: '/api/v1/metrics',
} as const;
