/**
 * Standardized Error Handling System
 * Provides consistent error types and error codes across the application
 */

export enum ErrorCode {
  // General errors (1000-1999)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Authentication errors (2000-2999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  CREDENTIALS_INVALID = 'CREDENTIALS_INVALID',
  
  // Authorization errors (3000-3999)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors (4000-4999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource errors (5000-5999)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Database errors (6000-6999)
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  
  // External service errors (7000-7999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // File/Upload errors (8000-8999)
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  FILE_TYPE_INVALID = 'FILE_TYPE_INVALID',
  
  // Business logic errors (9000-9999)
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  STATE_INVALID = 'STATE_INVALID',
}

export enum ErrorCategory {
  GENERAL = 'GENERAL',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RESOURCE = 'RESOURCE',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  FILE = 'FILE',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
}

export interface ErrorContext {
  [key: string]: any;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: any,
    public category: ErrorCategory = ErrorCategory.GENERAL,
    public context: ErrorContext = {},
    public timestamp: Date = new Date(),
    public correlationId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      statusCode: this.statusCode,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any, context: ErrorContext = {}) {
    super(ErrorCode.INVALID_INPUT, 400, message, details, ErrorCategory.VALIDATION, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.UNAUTHORIZED, 401, message, details, ErrorCategory.AUTHENTICATION, context);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.TOKEN_EXPIRED, 401, message, details, ErrorCategory.AUTHENTICATION, context);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid credentials', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.CREDENTIALS_INVALID, 401, message, details, ErrorCategory.AUTHENTICATION, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.FORBIDDEN, 403, message, details, ErrorCategory.AUTHORIZATION, context);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.INSUFFICIENT_PERMISSIONS, 403, message, details, ErrorCategory.AUTHORIZATION, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.NOT_FOUND, 404, message, details, ErrorCategory.RESOURCE, context);
  }
}

export class ResourceAlreadyExistsError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.RESOURCE_ALREADY_EXISTS, 409, message, details, ErrorCategory.RESOURCE, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any, context: ErrorContext = {}) {
    super(ErrorCode.RESOURCE_CONFLICT, 409, message, details, ErrorCategory.RESOURCE, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, context: ErrorContext = {}) {
    super(ErrorCode.VALIDATION_ERROR, 422, message, details, ErrorCategory.VALIDATION, context);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, 500, message, details, ErrorCategory.GENERAL, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.DATABASE_ERROR, 500, message, details, ErrorCategory.DATABASE, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, 502, message, { service, ...details }, ErrorCategory.EXTERNAL_SERVICE, context);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = 'AI service error', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.AI_SERVICE_ERROR, 502, message, details, ErrorCategory.EXTERNAL_SERVICE, context);
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, 429, message, details, ErrorCategory.EXTERNAL_SERVICE, context);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload error', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.FILE_UPLOAD_ERROR, 400, message, details, ErrorCategory.FILE, context);
  }
}

export class FileSizeExceededError extends AppError {
  constructor(maxSize: number, details?: any, context: ErrorContext = {}) {
    super(ErrorCode.FILE_SIZE_EXCEEDED, 400, `File size exceeds maximum of ${maxSize} bytes`, { maxSize, ...details }, ErrorCategory.FILE, context);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: any, context: ErrorContext = {}) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, 503, message, details, ErrorCategory.EXTERNAL_SERVICE, context);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Convert unknown error to AppError
   */
  static handleError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('unauthorized') || message.includes('authentication')) {
        return new UnauthorizedError(error.message);
      }
      
      if (message.includes('forbidden') || message.includes('permission')) {
        return new ForbiddenError(error.message);
      }
      
      if (message.includes('not found')) {
        return new NotFoundError(error.message);
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return new ValidationError(error.message);
      }

      return new InternalServerError(error.message);
    }

    return new InternalServerError('An unknown error occurred');
  }

  /**
   * Generate correlation ID for error tracking
   */
  static generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Format error for API response
   */
  static formatErrorResponse(error: AppError): {
    error: {
      code: string;
      message: string;
      category: string;
      correlationId: string;
      timestamp: string;
      details?: any;
      context?: ErrorContext;
    };
  } {
    return {
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        correlationId: error.correlationId || ErrorHandler.generateCorrelationId(),
        timestamp: error.timestamp.toISOString(),
        details: error.details,
        context: Object.keys(error.context).length > 0 ? error.context : undefined,
      },
    };
  }

  /**
   * Log error with context
   */
  static logError(error: AppError, logger: any): void {
    const errorData = error.toJSON();
    logger.error('Application error', errorData);
  }
}

/**
 * Async error wrapper for service methods
 */
export function asyncErrorHandler<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  return fn().catch((error: unknown) => {
    const appError = ErrorHandler.handleError(error);
    appError.correlationId = ErrorHandler.generateCorrelationId();
    appError.context = { ...context, ...appError.context };
    throw appError;
  });
}
