import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { UserRole } from '../types';

/**
 * Enterprise-grade JWT Validation Middleware
 * Token validation, refresh token management, and token blacklisting
 */

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  jti?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT configuration
 */
const JWT_CONFIG = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'votelens.ai',
  audience: 'votelens-api',
};

/**
 * Token blacklist for revoked tokens
 */
class TokenBlacklist {
  private redis: Redis | null = null;
  private localBlacklist: Set<string> = new Set();

  constructor(redis?: Redis) {
    this.redis = redis || null;
  }

  async addToBlacklist(token: string, expiry: number): Promise<void> {
    const jti = this.getTokenId(token);
    
    if (this.redis) {
      await this.redis.setex(`blacklist:${jti}`, expiry, '1');
    } else {
      this.localBlacklist.add(jti);
      // Remove from local blacklist after expiry
      setTimeout(() => {
        this.localBlacklist.delete(jti);
      }, expiry * 1000);
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const jti = this.getTokenId(token);
    
    if (this.redis) {
      const exists = await this.redis.exists(`blacklist:${jti}`);
      return exists === 1;
    }
    
    return this.localBlacklist.has(jti);
  }

  private getTokenId(token: string): string {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded.jti || decoded.userId;
    } catch {
      return '';
    }
  }

  async clear(): Promise<void> {
    if (this.redis) {
      const keys = await this.redis.keys('blacklist:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
    this.localBlacklist.clear();
  }
}

/**
 * JWT token manager
 */
export class JWTManager {
  private blacklist: TokenBlacklist;

  constructor(redis?: Redis) {
    this.blacklist = new TokenBlacklist(redis);
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_CONFIG.accessSecret, {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      jwtid: this.generateJTI(),
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_CONFIG.refreshSecret, {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      jwtid: this.generateJTI(),
    });
  }

  /**
   * Generate token pair
   */
  generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    // Check if token is blacklisted
    const isBlacklisted = await this.blacklist.isBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    return jwt.verify(token, JWT_CONFIG.accessSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }) as JWTPayload;
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_CONFIG.refreshSecret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }) as JWTPayload;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = this.verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
    return this.generateAccessToken(newPayload);
  }

  /**
   * Revoke token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      const expiry = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (expiry > 0) {
        await this.blacklist.addToBlacklist(token, expiry);
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // In a production system, this would revoke all tokens for a user
    // by storing a version number in the user record and checking it during verification
    console.log(`Revoking all tokens for user: ${userId}`);
  }

  /**
   * Generate JWT ID
   */
  private generateJTI(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

/**
 * JWT authentication middleware
 */
export const authenticate = (jwtManager: JWTManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'Access token required',
          },
        });
      }

      const token = authHeader.substring(7);
      const payload = await jwtManager.verifyAccessToken(token);

      // Attach user to request
      (req as any).user = payload;
      (req as any).token = token;

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          },
        });
      }

      if (error.message === 'Token has been revoked') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Token has been revoked',
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  };
};

/**
 * Optional authentication middleware
 */
export const optionalAuthenticate = (jwtManager: JWTManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await jwtManager.verifyAccessToken(token);
        (req as any).user = payload;
        (req as any).token = token;
      }
    } catch (error) {
      // Ignore errors for optional authentication
    }

    next();
  };
};

/**
 * Refresh token middleware
 */
export const refreshToken = (jwtManager: JWTManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'Refresh token required',
          },
        });
      }

      const newAccessToken = await jwtManager.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token has expired. Please login again',
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }
  };
};

/**
 * Logout middleware
 */
export const logout = (jwtManager: JWTManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = (req as any).token;
      
      if (token) {
        await jwtManager.revokeToken(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Token validation middleware for specific token types
 */
export const validateTokenType = (type: 'access' | 'refresh') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Token required',
        },
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.decode(token) as any;
      const isAccessToken = decoded.exp - decoded.iat < 3600; // Less than 1 hour = access token
      
      if (type === 'access' && !isAccessToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'WRONG_TOKEN_TYPE',
            message: 'Access token required',
          },
        });
      }

      if (type === 'refresh' && isAccessToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'WRONG_TOKEN_TYPE',
            message: 'Refresh token required',
          },
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
    }
  };
};

/**
 * Token rotation middleware
 * Rotates refresh tokens on each use
 */
export const rotateRefreshToken = (jwtManager: JWTManager) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next();
    }

    try {
      // Verify old refresh token
      const payload = jwtManager.verifyRefreshToken(refreshToken);
      
      // Revoke old refresh token
      await jwtManager.revokeToken(refreshToken);
      
      // Generate new refresh token
      const newPayload: JWTPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      
      const newRefreshToken = jwtManager.generateRefreshToken(newPayload);
      
      // Attach new refresh token to request
      (req as any).newRefreshToken = newRefreshToken;
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }
  };
};

/**
 * Export JWT manager singleton
 */
let jwtManagerInstance: JWTManager | null = null;

export const getJWTManager = (redis?: Redis): JWTManager => {
  if (!jwtManagerInstance) {
    jwtManagerInstance = new JWTManager(redis);
  }
  return jwtManagerInstance;
};

/**
 * Export JWT utilities
 */
export const jwtUtils = {
  manager: JWTManager,
  authenticate,
  optionalAuthenticate,
  refreshToken,
  logout,
  validateTokenType,
  rotateRefreshToken,
  getJWTManager,
};
