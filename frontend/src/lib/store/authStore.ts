import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, User } from '../../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },
      hasAnyRole: (roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    { name: 'auth-storage' }
  )
);
