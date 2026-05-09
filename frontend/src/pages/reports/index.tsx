import { BarChart3, Download, Calendar } from 'lucide-react';

export function Reports() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and export detailed election reports</p>
      </div>

      {/* Report Types */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 hover:border-primary cursor-pointer transition-colors">
          <BarChart3 className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Election Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Comprehensive overview of election results, turnout, and key metrics
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">PDF, Excel</span>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 hover:border-primary cursor-pointer transition-colors">
          <BarChart3 className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Constituency Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Detailed breakdown of results by constituency with demographic insights
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">PDF, Excel</span>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 hover:border-primary cursor-pointer transition-colors">
          <BarChart3 className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Historical comparison and trend analysis across multiple elections
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">PDF, Excel</span>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold">Recent Reports</h3>
        </div>
        <div className="divide-y">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">General Election 2024 Summary</p>
                <p className="text-sm text-muted-foreground">Generated 2 hours ago • PDF</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">2.4 MB</span>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Constituency Analysis - North Region</p>
                <p className="text-sm text-muted-foreground">Generated 1 day ago • Excel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">1.8 MB</span>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Trend Analysis 2020-2024</p>
                <p className="text-sm text-muted-foreground">Generated 3 days ago • PDF</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">3.2 MB</span>
              <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Generate New Report */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Custom Report</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Election</label>
            <select className="w-full rounded-md border bg-background px-4 py-2">
              <option>General Election 2024</option>
              <option>State Election 2023</option>
              <option>Local Election 2022</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Report Type</label>
            <select className="w-full rounded-md border bg-background px-4 py-2">
              <option>Summary</option>
              <option>Constituency Analysis</option>
              <option>Trend Analysis</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select className="w-full rounded-md border bg-background px-4 py-2">
                <option>Last 30 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <select className="w-full rounded-md border bg-background px-4 py-2">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <button className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Generate Report
        </button>
      </div>
    </div>
  );
}
