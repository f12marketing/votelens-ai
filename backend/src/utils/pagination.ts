/**
 * Pagination Utilities
 * Provides standardized pagination for all list endpoints
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginationHelper {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Parse and validate pagination parameters
   */
  static parsePagination(params: PaginationParams): {
    page: number;
    limit: number;
    offset: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } {
    const page = Math.max(params.page || this.DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(params.limit || this.DEFAULT_LIMIT, 1),
      this.MAX_LIMIT
    );
    const offset = params.offset !== undefined ? params.offset : (page - 1) * limit;
    const sortBy = params.sortBy;
    const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

    return { page, limit, offset, sortBy, sortOrder };
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  /**
   * Create paginated response
   */
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const pagination = this.calculatePaginationMeta(total, page, limit);

    return {
      data,
      pagination,
    };
  }

  /**
   * Apply pagination to array (for in-memory pagination)
   */
  static paginateArray<T>(
    array: T[],
    page: number,
    limit: number
  ): T[] {
    const offset = (page - 1) * limit;
    return array.slice(offset, offset + limit);
  }

  /**
   * Apply sorting to array
   */
  static sortArray<T>(
    array: T[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): T[] {
    return [...array].sort((a: any, b: any) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  /**
   * Get pagination query string
   */
  static getPaginationQueryString(params: PaginationParams): string {
    const { page, limit, sortBy, sortOrder } = this.parsePagination(params);
    const query = new URLSearchParams();
    
    query.append('page', page.toString());
    query.append('limit', limit.toString());
    
    if (sortBy) {
      query.append('sortBy', sortBy);
      query.append('sortOrder', sortOrder);
    }

    return query.toString();
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(params: PaginationParams): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
      errors.push('Page must be a positive integer');
    }

    if (params.limit !== undefined && (params.limit < 1 || params.limit > this.MAX_LIMIT)) {
      errors.push(`Limit must be between 1 and ${this.MAX_LIMIT}`);
    }

    if (params.offset !== undefined && params.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get cursor-based pagination info
   */
  static getCursorPaginationInfo<T>(
    data: T[],
    limit: number,
    cursorField: string = 'id'
  ): {
    nextCursor: string | null;
    previousCursor: string | null;
    hasNext: boolean;
    hasPrevious: boolean;
  } {
    const nextCursor = data.length === limit ? String((data[data.length - 1] as any)[cursorField]) : null;
    const previousCursor = data.length > 0 ? String((data[0] as any)[cursorField]) : null;

    return {
      nextCursor,
      previousCursor,
      hasNext: !!nextCursor,
      hasPrevious: !!previousCursor,
    };
  }
}

/**
 * Express middleware for pagination
 */
export function paginationMiddleware(req: any, _res: any, next: any) {
  const pagination = PaginationHelper.parsePagination({
    page: parseInt(req.query.page),
    limit: parseInt(req.query.limit),
    offset: parseInt(req.query.offset),
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  });

  req.pagination = pagination;
  next();
}
