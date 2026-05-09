import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export abstract class BaseController {
  protected success<T>(
    res: Response,
    data: T,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  protected error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  protected async asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
