import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body || {};
      const query = req.query || {};
      const params = req.params || {};

      const validatedBody = schema.shape?.body
        ? await schema.shape.body.parseAsync(body)
        : body;

      const validatedQuery = schema.shape?.query
        ? await schema.shape.query.parseAsync(query)
        : query;

      const validatedParams = schema.shape?.params
        ? await schema.shape.params.parseAsync(params)
        : params;

      req.body = validatedBody;
      req.query = validatedQuery;
      req.params = validatedParams;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError(
          'Validation failed',
          formattedErrors
        );
      }
      next(error);
    }
  };
