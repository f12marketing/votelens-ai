import React, { useState, useEffect } from 'react';
import {
  Layout,
  LayoutDashboard,
  Filter,
  TrendingUp,
  BarChart3,
  Download,
  Settings,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  X,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'monitor';
  recommendations: string[];
  tags: string[];
}

interface Workspace {
  id: string;
  name: string;
  summary: {
    totalInsights: number;
    highPriorityInsights: number;
    keyMetrics: Array<{ label: string; value: number; change?: number }>;
    topInsights: string[];
  };
}

export const AnalyticsWorkspace: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'constituencies' | 'export'>('insights');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/analytics/workspaces');
      const data = await response.json();
      setWorkspaces(data.data.workspaces);
      if (data.data.workspaces.length > 0) {
        setSelectedWorkspace(data.data.workspaces[0]);
        fetchInsights(data.data.workspaces[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const fetchInsights = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/workspaces/${workspaceId}`);
      const data = await response.json();
      setInsights(data.data.workspace.insights || []);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'opportunity':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'anomaly':
        return <Layers className="w-5 h-5 text-purple-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Immediate</span>;
      case 'soon':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Soon</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Monitor</span>;
    }
  };

  const filteredInsights = insights.filter(insight =>
    insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Workspace</h1>
                <p className="text-sm text-gray-500">Professional election analytics dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All States</option>
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Parties</option>
                  <option>BJP</option>
                  <option>INC</option>
                  <option>DMK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Election Year</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Years</option>
                  <option>2024</option>
                  <option>2019</option>
                  <option>2014</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitiveness</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All</option>
                  <option>Safe</option>
                  <option>Competitive</option>
                  <option>Tossup</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Workspace Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setSelectedWorkspace(workspace);
                  fetchInsights(workspace.id);
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedWorkspace?.id === workspace.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {workspace.name}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {selectedWorkspace && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {selectedWorkspace.summary.keyMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                  {metric.change !== undefined && (
                    <span className={`text-sm ml-2 ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search insights, trends, or constituencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {[
              { id: 'insights', label: 'Insights', icon: CheckCircle },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'constituencies', label: 'Constituencies', icon: Layers },
              { id: 'export', label: 'Export', icon: Download },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'insights' && selectedWorkspace && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {selectedWorkspace.summary.totalInsights}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-500">Loading insights...</p>
              </div>
            ) : filteredInsights.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No insights found</p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <div key={insight.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                          <p className="text-gray-600 mt-1">{insight.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(insight.urgency)}
                          <span className="text-sm text-gray-500">{Math.round(insight.confidence * 100)}% confidence</span>
                        </div>
                      </div>

                      {insight.recommendations.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-2">Recommendations:</p>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {insight.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {insight.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Trend analysis coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'constituencies' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Constituency analytics coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Workspace</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { format: 'PDF', icon: Download, desc: 'Print-ready report' },
                { format: 'Excel', icon: BarChart3, desc: 'Spreadsheet data' },
                { format: 'CSV', icon: Download, desc: 'Raw data export' },
              ].map((option) => (
                <button
                  key={option.format}
                  className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <option.icon className="w-8 h-8 text-gray-600 mb-2" />
                  <span className="font-medium text-gray-900">{option.format}</span>
                  <span className="text-sm text-gray-500">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
