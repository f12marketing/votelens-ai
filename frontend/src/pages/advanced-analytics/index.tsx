import { BarChart3, LineChart, PieChart, TrendingUp, Download, Filter } from "lucide-react";

export function AdvancedAnalytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground">Deep dive into election data and trends</p>
      </div>

      {/* Analytics Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <select className="px-4 py-2 border border-border-subtle rounded-md text-sm bg-background">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
        </div>
        <button className="px-4 py-2 border border-border-subtle rounded-md text-sm font-medium flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Voter Turnout</p>
              <h3 className="text-2xl font-bold">67.8%</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">+5.2% from last election</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Margin of Victory</p>
              <h3 className="text-2xl font-bold">12.4%</h3>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Average across constituencies</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Swing Voters</p>
              <h3 className="text-2xl font-bold">8.3%</h3>
            </div>
            <LineChart className="h-8 w-8 text-ai-accent" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Key demographic segment</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prediction Accuracy</p>
              <h3 className="text-2xl font-bold">94.2%</h3>
            </div>
            <PieChart className="h-8 w-8 text-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">AI model confidence</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Voter Turnover Trends</h3>
          <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart placeholder</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Demographic Distribution</h3>
          <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart placeholder</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Historical Performance</h3>
          <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart placeholder</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
          <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart placeholder</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Constituency</label>
            <select className="w-full px-4 py-2 border border-border-subtle rounded-md text-sm bg-background">
              <option>All Constituencies</option>
              <option>North District</option>
              <option>South District</option>
              <option>East District</option>
              <option>West District</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Party</label>
            <select className="w-full px-4 py-2 border border-border-subtle rounded-md text-sm bg-background">
              <option>All Parties</option>
              <option>Party A</option>
              <option>Party B</option>
              <option>Party C</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Age Group</label>
            <select className="w-full px-4 py-2 border border-border-subtle rounded-md text-sm bg-background">
              <option>All Ages</option>
              <option>18-25</option>
              <option>26-35</option>
              <option>36-45</option>
              <option>46-55</option>
              <option>55+</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
