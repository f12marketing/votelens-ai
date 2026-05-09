import { Link } from 'react-router-dom';
import { ArrowRight, Brain, BarChart3, Zap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
              <Zap className="mr-2 h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI-Powered Election Intelligence</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Understand Elections
              <br />
              <span className="text-primary">Like Never Before</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Real-time analytics, AI-generated insights, and interactive visualizations for modern democracy
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/ask-ai"
                className="inline-flex items-center justify-center rounded-lg border px-8 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Ask AI
                <Brain className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Powered by AI</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI-Generated Insights</h3>
              <p className="text-muted-foreground">
                Get actionable insights powered by Gemini AI, analyzing patterns and predicting trends
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Real-Time Analytics</h3>
              <p className="text-muted-foreground">
                Monitor election data in real-time with interactive dashboards and live updates
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Natural Language Query</h3>
              <p className="text-muted-foreground">
                Ask questions in plain English and get instant answers about election data
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
