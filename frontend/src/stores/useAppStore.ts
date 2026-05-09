import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Global Application State Management
 * Uses Zustand for efficient state management without provider boilerplate
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'GUEST' | 'USER' | 'ANALYST' | 'ADMIN';
}

export interface Election {
  id: number;
  name: string;
  year: number;
  description?: string;
}

export interface Constituency {
  id: string;
  name: string;
  state: string;
  district: string;
}

export interface FilterState {
  state?: string;
  party?: string;
  year?: number;
  turnoutRange?: [number, number];
}

export interface AppState {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Data
  selectedElection: Election | null;
  setSelectedElection: (election: Election | null) => void;
  
  selectedConstituency: Constituency | null;
  setSelectedConstituency: (constituency: Constituency | null) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Loading States
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error State
  error: string | null;
  setError: (error: string | null) => void;

  // AI Features
  eli15ModeEnabled: boolean;
  toggleEli15Mode: () => void;

  anchorModeEnabled: boolean;
  toggleAnchorMode: () => void;

  // Dashboard View
  dashboardView: 'overview' | 'analytics' | 'constituency' | 'historical';
  setDashboardView: (view: 'overview' | 'analytics' | 'constituency' | 'historical') => void;
}

const initialFilters: FilterState = {
  state: undefined,
  party: undefined,
  year: undefined,
  turnoutRange: undefined,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // User & Auth
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        logout: () => set({ user: null, isAuthenticated: false }),

        // UI State
        sidebarOpen: true,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        // Theme
        theme: 'light',
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

        // Data
        selectedElection: null,
        setSelectedElection: (election) => set({ selectedElection: election }),
        
        selectedConstituency: null,
        setSelectedConstituency: (constituency) => set({ selectedConstituency: constituency }),

        // Filters
        filters: initialFilters,
        setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
        resetFilters: () => set({ filters: initialFilters }),

        // Loading States
        isLoading: false,
        setIsLoading: (loading) => set({ isLoading: loading }),

        // Error State
        error: null,
        setError: (error) => set({ error }),

        // AI Features
        eli15ModeEnabled: false,
        toggleEli15Mode: () => set((state) => ({ eli15ModeEnabled: !state.eli15ModeEnabled })),

        anchorModeEnabled: false,
        toggleAnchorMode: () => set((state) => ({ anchorModeEnabled: !state.anchorModeEnabled })),

        // Dashboard View
        dashboardView: 'overview',
        setDashboardView: (view) => set({ dashboardView: view }),
      }),
      {
        name: 'voteLens-storage',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          eli15ModeEnabled: state.eli15ModeEnabled,
          anchorModeEnabled: state.anchorModeEnabled,
        }),
      }
    )
  )
);
