import { Brain, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

export function Insights() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">AI-generated insights and predictions</p>
      </div>

      {/* Insight Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <span className="text-xs rounded-full bg-green-500/10 px-2 py-1 text-green-500">Trend</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Voter Turnout Increase</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Voter turnout has increased by 12% compared to the previous election, driven by younger voter engagement in urban constituencies.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 94%</span>
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <span className="text-xs rounded-full bg-yellow-500/10 px-2 py-1 text-yellow-500">Anomaly</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Unusual Voting Pattern</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Detected unusual voting patterns in 3 constituencies that may indicate irregularities requiring further investigation.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 87%</span>
            <span className="text-xs text-muted-foreground">5 hours ago</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <span className="text-xs rounded-full bg-purple-500/10 px-2 py-1 text-purple-500">Prediction</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Swing Constituency Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            15 constituencies identified as potential swing seats with margin of victory under 5% in historical data.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 78%</span>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <Brain className="h-8 w-8 text-blue-500" />
            <span className="text-xs rounded-full bg-blue-500/10 px-2 py-1 text-blue-500">Demographic</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Age Group Preferences</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Voters aged 18-25 show 65% preference for progressive policies, while 45+ demographic favors traditional platforms.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 91%</span>
            <span className="text-xs text-muted-foreground">2 days ago</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <span className="text-xs rounded-full bg-green-500/10 px-2 py-1 text-green-500">Trend</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Campaign Impact</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Digital campaign engagement correlates with 8% higher turnout in constituencies with >50% internet penetration.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 82%</span>
            <span className="text-xs text-muted-foreground">3 days ago</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <span className="text-xs rounded-full bg-purple-500/10 px-2 py-1 text-purple-500">Prediction</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Regional Shift</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Eastern region showing 15% shift towards opposition parties based on early voting data and demographic trends.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence: 76%</span>
            <span className="text-xs text-muted-foreground">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
