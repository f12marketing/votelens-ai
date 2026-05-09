import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './lib/providers/theme-provider';
import { AuthProvider } from './lib/providers/auth-provider';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { routes } from './lib/config/routes';

// Lazy load components
const LandingPage = lazy(() => import('./pages/landing'));
const Login = lazy(() => import('./pages/auth/login'));
const Register = lazy(() => import('./pages/auth/register'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Upload = lazy(() => import('./pages/upload'));
const Constituencies = lazy(() => import('./pages/constituencies'));
const Insights = lazy(() => import('./pages/insights'));
const AskAI = lazy(() => import('./pages/ask-ai'));
const Reports = lazy(() => import('./pages/reports'));
const AdvancedAnalytics = lazy(() => import('./pages/advanced-analytics'));
const AdminDashboard = lazy(() => import('./pages/admin'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
        <p className="mt-4 text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="votelens-ui-theme">
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['user', 'analyst', 'admin']}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="upload" element={<Upload />} />
                <Route path="constituencies" element={<Constituencies />} />
                <Route path="insights" element={<Insights />} />
                <Route path="ask-ai" element={<AskAI />} />
                <Route path="reports" element={<Reports />} />
              </Route>

              {/* Analyst & Admin Routes */}
              <Route path="/advanced-analytics" element={
                <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdvancedAnalytics />} />
              </Route>

              {/* Admin Only Route */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
