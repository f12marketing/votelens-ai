import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Upload = lazy(() => import('./pages/Upload').then(module => ({ default: module.Upload })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Elections = lazy(() => import('./pages/Elections').then(module => ({ default: module.Elections })));
const Insights = lazy(() => import('./pages/Insights').then(module => ({ default: module.Insights })));
const Comparison = lazy(() => import('./pages/Comparison').then(module => ({ default: module.Comparison })));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));

// Lazy load heavy components
const ChartComponent = lazy(() => import('./components/charts/ChartComponent'));
const MapComponent = lazy(() => import('./components/maps/MapComponent'));
const DataTable = lazy(() => import('./components/ui/DataTable'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Route with lazy loading wrapper
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

export const OptimizedApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - Low priority */}
        <Route
          path="/login"
          element={
            <LazyRoute>
              <Login />
            </LazyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <LazyRoute>
              <Register />
            </LazyRoute>
          }
        />

        {/* Main App Routes - High priority */}
        <Route
          path="/"
          element={
            <LazyRoute>
              <Dashboard />
            </LazyRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <LazyRoute>
              <Analytics />
            </LazyRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <LazyRoute>
              <Upload />
            </LazyRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <LazyRoute>
              <Reports />
            </LazyRoute>
          }
        />
        <Route
          path="/elections"
          element={
            <LazyRoute>
              <Elections />
            </LazyRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <LazyRoute>
              <Insights />
            </LazyRoute>
          }
        />
        <Route
          path="/comparison"
          element={
            <LazyRoute>
              <Comparison />
            </LazyRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <LazyRoute>
              <Chat />
            </LazyRoute>
          }
        />

        {/* Admin Route - Lowest priority */}
        <Route
          path="/admin"
          element={
            <LazyRoute>
              <Admin />
            </LazyRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Export lazy-loaded heavy components for use in other components
export const LazyChart = ChartComponent;
export const LazyMap = MapComponent;
export const LazyDataTable = DataTable;
