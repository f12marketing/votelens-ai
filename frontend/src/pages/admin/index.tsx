import { Users, Settings, Database, Shield, Activity, Key } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, settings, and system configuration</p>
      </div>

      {/* Admin Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">1,234</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">+12 this week</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
              <h3 className="text-2xl font-bold">89</h3>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Current active users</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">API Keys</p>
              <h3 className="text-2xl font-bold">45</h3>
            </div>
            <Key className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Active API keys</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
              <h3 className="text-2xl font-bold">45.2 GB</h3>
            </div>
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">of 100 GB quota</p>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage user accounts, roles, and permissions
          </p>
          <button className="w-full rounded-md border px-4 py-2 text-sm">
            Manage Users
          </button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">System Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure application settings and preferences
          </p>
          <button className="w-full rounded-md border px-4 py-2 text-sm">
            Configure Settings
          </button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Database Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            View database status, run migrations, and manage backups
          </p>
          <button className="w-full rounded-md border px-4 py-2 text-sm">
            Manage Database
          </button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage security settings, audit logs, and access control
          </p>
          <button className="w-full rounded-md border px-4 py-2 text-sm">
            Security Settings
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">System Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="font-medium">User registration</p>
              <p className="text-sm text-muted-foreground">New user: john@example.com</p>
            </div>
            <span className="text-sm text-muted-foreground">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="font-medium">API key generated</p>
              <p className="text-sm text-muted-foreground">User: admin@votelens.ai</p>
            </div>
            <span className="text-sm text-muted-foreground">1 hour ago</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="font-medium">Data export completed</p>
              <p className="text-sm text-muted-foreground">Election summary report</p>
            </div>
            <span className="text-sm text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System backup</p>
              <p className="text-sm text-muted-foreground">Automated daily backup</p>
            </div>
            <span className="text-sm text-muted-foreground">6 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
