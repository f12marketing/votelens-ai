import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { authService } from '../services/auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from '../dto/auth.dto';

export class AuthController extends BaseController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: LoginDto = req.body;
      const result = await authService.login(dto);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: RegisterDto = req.body;
      const result = await authService.register(dto);
      this.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      await authService.logout(userId);
      this.success(res, { message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: RefreshTokenDto = req.body;
      const result = await authService.refreshToken(dto.refreshToken);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const user = await authService.getMe(userId);
      this.success(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
