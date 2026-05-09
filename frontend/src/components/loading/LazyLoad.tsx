import { lazy, Suspense, ComponentType } from "react";

interface LazyLoadProps {
  factory: () => Promise<{ default: ComponentType }>;
  fallback?: React.ReactNode;
}

export function LazyLoad({ factory, fallback }: LazyLoadProps) {
  const LazyComponent = lazy(factory);

  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent />
    </Suspense>
  );
}
