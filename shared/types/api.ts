export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export interface QueryContext {
  elections: any[];
  availableMetrics: string[];
  availableDimensions: string[];
}

export interface QueryResponse {
  interpretation: string;
  sqlQuery?: string;
  visualizationType?: string;
  dataRequirements: string[];
  responseFormat: string;
}

export interface UploadResponse {
  uploadId: string;
  uploadUrl: string;
  chunkSize: number;
  totalChunks: number;
}
