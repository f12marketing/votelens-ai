import { TrendingUp, Users, FileText, Brain } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your election intelligence</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Elections</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Constituencies</p>
              <h3 className="text-2xl font-bold">543</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">+15 from last week</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI Insights Generated</p>
              <h3 className="text-2xl font-bold">89</h3>
            </div>
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">+12 today</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data Processed</p>
              <h3 className="text-2xl font-bold">2.4M</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">+18% from last month</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">New election uploaded</p>
              <p className="text-sm text-muted-foreground">General Election 2024</p>
            </div>
            <span className="text-sm text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">AI insights generated</p>
              <p className="text-sm text-muted-foreground">State Election 2024</p>
            </div>
            <span className="text-sm text-muted-foreground">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data processing completed</p>
              <p className="text-sm text-muted-foreground">Local Election 2023</p>
            </div>
            <span className="text-sm text-muted-foreground">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
