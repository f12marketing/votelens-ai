import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Database,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  users: { total: number; active: number; suspended: number };
  moderations: { total: number; pending: number; approved: number; flagged: number };
  system: { status: 'healthy' | 'degraded' | 'down'; uptime: number };
  logs: { total: number; critical: number; last24Hours: number };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLoginAt?: string;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'moderation' | 'logs' | 'monitoring'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
                <p className="text-sm text-gray-500">VoteLens AI Management</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'roles', label: 'Roles', icon: Shield },
              { id: 'moderation', label: 'Moderation', icon: Database },
              { id: 'logs', label: 'Audit Logs', icon: FileText },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'roles' && <RolesTab />}
            {activeTab === 'moderation' && <ModerationTab />}
            {activeTab === 'logs' && <LogsTab />}
            {activeTab === 'monitoring' && <MonitoringTab />}
          </>
        )}
      </div>
    </div>
  );
};

const OverviewTab: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Users"
        value={stats?.users.total || 0}
        change="+5"
        icon={Users}
        color="blue"
      />
      <StatCard
        title="Active Users"
        value={stats?.users.active || 0}
        change="+3"
        icon={CheckCircle}
        color="green"
      />
      <StatCard
        title="Pending Moderations"
        value={stats?.moderations.pending || 0}
        change="-2"
        icon={AlertTriangle}
        color="yellow"
      />
      <StatCard
        title="System Uptime"
        value={`${stats?.system.uptime || 0}d`}
        change="stable"
        icon={Activity}
        color="purple"
      />
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">User created</p>
              <p className="text-xs text-gray-500">New user registered</p>
            </div>
            <span className="text-xs text-gray-400">{i}h ago</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: number | string;
  change: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-${color}-100 rounded-full`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <span className={`text-sm font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    <p className="text-sm text-gray-500">{title}</p>
  </div>
);

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => {
                      const newSet = new Set(selectedUsers);
                      if (newSet.has(user.id)) newSet.delete(user.id);
                      else newSet.add(user.id);
                      setSelectedUsers(newSet);
                    }}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RolesTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Plus className="w-4 h-4" />
        Create Role
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { name: 'Administrator', description: 'Full system access', permissions: 20, isSystem: true },
        { name: 'Analyst', description: 'Analytics and reporting', permissions: 12, isSystem: true },
        { name: 'User', description: 'Basic read access', permissions: 5, isSystem: true },
      ].map((role) => (
        <div key={role.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{role.name}</h3>
            </div>
            {role.isSystem && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">System</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{role.description}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{role.permissions} permissions</span>
            <button className="text-blue-600 hover:text-blue-700">View →</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ModerationTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Dataset Moderation</h2>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Pending</p>
        <p className="text-2xl font-bold text-yellow-600">12</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Approved</p>
        <p className="text-2xl font-bold text-green-600">450</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Rejected</p>
        <p className="text-2xl font-bold text-red-600">20</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Flagged</p>
        <p className="text-2xl font-bold text-orange-600">10</p>
      </div>
    </div>

    {/* Moderation Queue */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Pending Review</h3>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Election Data 2024</p>
                <p className="text-sm text-gray-500">Uploaded by user@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                Approve
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LogsTab: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[
            { timestamp: '2024-03-15 10:30:00', user: 'admin@votelens.ai', action: 'user.created', resource: 'users', severity: 'info' },
            { timestamp: '2024-03-15 09:15:00', user: 'analyst@votelens.ai', action: 'dataset.uploaded', resource: 'datasets', severity: 'info' },
            { timestamp: '2024-03-15 08:45:00', user: 'system', action: 'system.error', resource: 'system', severity: 'error' },
          ].map((log, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-500">{log.timestamp}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{log.user}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{log.resource}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  log.severity === 'error' ? 'bg-red-100 text-red-700' :
                  log.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {log.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MonitoringTab: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-gray-900">System Monitoring</h2>

    {/* System Health */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">System Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Database', status: 'healthy', uptime: '99.9%' },
          { name: 'AI Service', status: 'healthy', uptime: '99.5%' },
          { name: 'API', status: 'healthy', uptime: '99.8%' },
        ].map((service) => (
          <div key={service.name} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{service.name}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                service.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {service.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Resource Usage */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">CPU Usage</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '25%' }} />
          </div>
          <span className="text-sm font-medium text-gray-900">25%</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Memory Usage</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: '35%' }} />
          </div>
          <span className="text-sm font-medium text-gray-900">35%</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Disk Usage</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-600 rounded-full" style={{ width: '20%' }} />
          </div>
          <span className="text-sm font-medium text-gray-900">20%</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Network</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Inbound</span>
            <span className="text-gray-900">1.2 MB/s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Outbound</span>
            <span className="text-gray-900">0.8 MB/s</span>
          </div>
        </div>
      </div>
    </div>

    {/* AI Usage */}
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">AI Usage</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">12,345</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Tokens</p>
          <p className="text-2xl font-bold text-gray-900">1.2M</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Latency</p>
          <p className="text-2xl font-bold text-gray-900">850ms</p>
        </div>
      </div>
    </div>
  </div>
);
