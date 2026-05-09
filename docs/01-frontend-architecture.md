# Frontend Architecture

## Technology Stack

- **Framework**: React 18+ with Vite 5+ (build tool)
- **Styling**: Tailwind CSS 3.4+ (utility-first CSS)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand 4+ (global state) + React Query 5+ (server state)
- **Routing**: React Router 6+ (file-based routing)
- **Charts**: Recharts 2+ (data visualization)
- **Maps**: Leaflet 4+ + React-Leaflet 4+ (interactive maps)
- **Forms**: React Hook Form 7+ + Zod 3+ (validation)
- **Authentication**: Firebase SDK 10+ (client-side auth)
- **HTTP Client**: Axios 1+ (API communication)
- **Date Handling**: date-fns 3+ (date utilities)

## Application Structure

```
frontend/
├── src/
│   ├── app/                          # App layout and routing
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Main dashboard
│   │   │   ├── elections/page.tsx    # Election management
│   │   │   ├── constituencies/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   ├── maps/page.tsx
│   │   │   └── query/page.tsx
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       └── organization/page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── elections/
│   │   │   ├── ElectionCard.tsx
│   │   │   ├── ElectionList.tsx
│   │   │   └── UploadModal.tsx
│   │   ├── maps/
│   │   │   ├── ElectionMap.tsx
│   │   │   ├── ConstituencyMap.tsx
│   │   │   └── MapLegend.tsx
│   │   ├── insights/
│   │   │   ├── InsightCard.tsx
│   │   │   ├── AIInsight.tsx
│   │   │   └── TrendAnalysis.tsx
│   │   └── query/
│   │       ├── QueryInput.tsx
│   │       └── QueryResults.tsx
│   ├── lib/
│   │   ├── api/                      # API clients
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── elections.ts
│   │   │   ├── analytics.ts
│   │   │   ├── insights.ts
│   │   │   └── query.ts
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useElections.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useQuery.ts
│   │   ├── store/                    # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── electionStore.ts
│   │   │   └── uiStore.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Classname utility
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       └── api.ts
│   ├── types/
│   │   ├── election.ts
│   │   ├── constituency.ts
│   │   ├── insight.ts
│   │   └── user.ts
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx                      # Entry point
├── public/
│   ├── assets/
│   └── icons/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Component Architecture

### Provider Stack (Bottom-Up)

```typescript
// src/app/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <BrowserRouter>
            <Routes>
              {/* Routes */}
            </Routes>
          </BrowserRouter>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Component Hierarchy

```
App
├── Layout
│   ├── Header (user info, notifications)
│   ├── Sidebar (navigation)
│   └── Main Content
│       ├── Dashboard
│       ├── Elections
│       ├── Constituencies
│       ├── Analytics
│       ├── Insights
│       ├── Maps
│       └── Query
└── ToastProvider
```

## State Management Strategy

### Client State (Zustand)

```typescript
// src/lib/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// src/lib/store/electionStore.ts
interface ElectionState {
  selectedElection: Election | null;
  selectedConstituency: Constituency | null;
  filters: FilterState;
  setSelectedElection: (election: Election) => void;
  setSelectedConstituency: (constituency: Constituency) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
}

export const useElectionStore = create<ElectionState>((set) => ({
  selectedElection: null,
  selectedConstituency: null,
  filters: { status: [], type: [], dateRange: null },
  setSelectedElection: (election) => set({ selectedElection: election }),
  setSelectedConstituency: (constituency) => set({ selectedConstituency: constituency }),
  updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
```

### Server State (React Query)

```typescript
// src/lib/hooks/useElections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Election } from '../types/election';

export function useElections() {
  return useQuery({
    queryKey: ['elections'],
    queryFn: () => apiClient.get<Election[]>('/elections').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useElection(id: string) {
  return useQuery({
    queryKey: ['elections', id],
    queryFn: () => apiClient.get<Election>(`/elections/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateElectionDto) => 
      apiClient.post<Election>('/elections', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
  });
}
```

## Data Flow Architecture

```
User Action → Component → Hook/Store → API Client → Backend
                ↓
            State Update → Re-render
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/dashboard'));
const Elections = lazy(() => import('./pages/dashboard/elections'));
const Analytics = lazy(() => import('./pages/dashboard/analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/elections" element={<Elections />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// Custom image component with optimization
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({ src, alt, width = 800, height = 600 }: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      className="rounded-lg"
    />
  );
}
```

### Memoization

```typescript
// React.memo for component memoization
export const ElectionCard = React.memo(({ election }: { election: Election }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{election.name}</CardTitle>
      </CardHeader>
    </Card>
  );
});

// useMemo for expensive computations
const sortedElections = useMemo(() => {
  return elections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}, [elections]);

// useCallback for function memoization
const handleSelect = useCallback((election: Election) => {
  setSelectedElection(election);
}, []);
```

### Virtual Scrolling

```typescript
// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

interface VirtualListProps {
  items: any[];
  itemHeight: number;
  height: number;
}

export function VirtualList({ items, itemHeight, height }: VirtualListProps) {
  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Routing Architecture

```typescript
// src/app/routes.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'auth/login', element: <Login /> },
      { path: 'auth/register', element: <Register /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'elections', element: <Elections /> },
          { path: 'elections/:id', element: <ElectionDetails /> },
          { path: 'constituencies', element: <Constituencies /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'insights', element: <Insights /> },
          { path: 'maps', element: <Maps /> },
          { path: 'query', element: <Query /> },
        ],
      },
    ],
  },
]);
```

## API Client Configuration

```typescript
// src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Error Handling

```typescript
// Error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Error fallback component
function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Reload
        </button>
      </div>
    </div>
  );
}
```

## Accessibility (WCAG 2.1 AA)

```typescript
// Accessible button component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function AccessibleButton({ variant = 'primary', children, ...props }: AccessibleButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      aria-label={props['aria-label'] || typeof children === 'string' ? children : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

// Focus management
export function useFocusTrap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, []);

  return containerRef;
}
```

## Testing Strategy

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ElectionCard } from './ElectionCard';

describe('ElectionCard', () => {
  const mockElection = {
    id: '1',
    name: 'Test Election',
    date: '2024-01-01',
    status: 'COMPLETED',
  };

  it('renders election name', () => {
    render(<ElectionCard election={mockElection} />);
    expect(screen.getByText('Test Election')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ElectionCard election={mockElection} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Test Election'));
    expect(handleClick).toHaveBeenCalledWith(mockElection);
  });
});

// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useElections } from './useElections';

describe('useElections', () => {
  it('fetches elections on mount', async () => {
    const { result } = renderHook(() => useElections());
    
    await act(async () => {
      await result.current.refetch();
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```
