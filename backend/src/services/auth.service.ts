import { BaseService } from './base.service';
import { UnauthorizedError, ConflictError } from '../utils/errors';
import { User, UserRole } from '../types';
import { LoginDto, RegisterDto } from '../dto/auth.dto';

export class AuthService extends BaseService {
  async login(dto: LoginDto): Promise<{ user: User; token: string }> {
    this.logInfo('Login attempt', { email: dto.email });

    // TODO: Implement actual Firebase authentication
    // For now, mock authentication
    if (dto.email === 'admin@example.com' && dto.password === 'admin123') {
      const user: User = {
        id: 'admin-user-id',
        email: dto.email,
        name: 'Admin User',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = 'mock-jwt-token';

      this.logInfo('Login successful', { userId: user.id });
      return { user, token };
    }

    throw new UnauthorizedError('Invalid email or password');
  }

  async register(dto: RegisterDto): Promise<{ user: User; token: string }> {
    this.logInfo('Registration attempt', { email: dto.email });

    // TODO: Check if user already exists in database
    // TODO: Create user in database with Firebase Auth
    // TODO: Return user and token

    const user: User = {
      id: 'new-user-id',
      email: dto.email,
      name: dto.name,
      role: UserRole.USER,
      organization: dto.organization,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = 'mock-jwt-token';

    this.logInfo('Registration successful', { userId: user.id });
    return { user, token };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    this.logInfo('Token refresh attempt');

    // TODO: Verify refresh token
    // TODO: Generate new access token

    const token = 'new-mock-jwt-token';

    this.logInfo('Token refresh successful');
    return { token };
  }

  async logout(userId: string): Promise<void> {
    this.logInfo('Logout attempt', { userId });

    // TODO: Invalidate token
    // TODO: Log logout

    this.logInfo('Logout successful', { userId });
  }

  async getMe(userId: string): Promise<User> {
    this.logInfo('Get user attempt', { userId });

    // TODO: Fetch user from database

    const user: User = {
      id: userId,
      email: 'user@example.com',
      name: 'User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logInfo('Get user successful', { userId });
    return user;
  }
}

export const authService = new AuthService();
