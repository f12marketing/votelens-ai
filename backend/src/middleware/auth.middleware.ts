import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // TODO: Verify token with Firebase Admin SDK or JWT
    // const decodedToken = await admin.auth().verifyIdToken(token);
    
    // For now, mock user data
    req.user = {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      role: UserRole.USER,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `User with role ${req.user.role} is not authorized to access this resource`
      );
    }

    next();
  };
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // TODO: Verify token with Firebase Admin SDK or JWT
    // For now, mock user data
    req.user = {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      role: UserRole.USER,
    };
  }

  next();
};
