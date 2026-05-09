import { Map, Filter, Search } from 'lucide-react';

export function Constituencies() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Constituency Explorer</h1>
        <p className="text-muted-foreground">Explore and analyze constituency-level election data</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search constituencies..."
            className="w-full rounded-md border bg-background pl-10 pr-4 py-2"
          />
        </div>
        <button className="flex items-center gap-2 rounded-md border bg-background px-4 py-2">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex h-[500px] items-center justify-center border-2 border-dashed">
          <div className="text-center">
            <Map className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Interactive Map</h3>
            <p className="text-muted-foreground">Constituency map visualization will appear here</p>
          </div>
        </div>
      </div>

      {/* Constituency List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold">Constituencies</h3>
        </div>
        <div className="divide-y">
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">North Constituency</p>
              <p className="text-sm text-muted-foreground">District: Central • Type: Parliamentary</p>
            </div>
            <div className="text-right">
              <p className="font-medium">245,000 voters</p>
              <p className="text-sm text-muted-foreground">Turnout: 68%</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">South Constituency</p>
              <p className="text-sm text-muted-foreground">District: Southern • Type: Parliamentary</p>
            </div>
            <div className="text-right">
              <p className="font-medium">312,000 voters</p>
              <p className="text-sm text-muted-foreground">Turnout: 72%</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">East Constituency</p>
              <p className="text-sm text-muted-foreground">District: Eastern • Type: Assembly</p>
            </div>
            <div className="text-right">
              <p className="font-medium">189,000 voters</p>
              <p className="text-sm text-muted-foreground">Turnout: 65%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
