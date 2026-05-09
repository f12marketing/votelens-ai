import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Wand2,
  LayoutTemplate,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Eye,
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  format: 'pdf' | 'csv' | 'png' | 'svg';
  icon: React.ReactNode;
  description: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  isDefault: boolean;
}

interface ExportConfig {
  templateId: string;
  includeCharts: boolean;
  includeExecutiveSummary: boolean;
  includeRecommendations: boolean;
  branding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export const ReportExport: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'png' | 'svg' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template-executive');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    templateId: 'template-executive',
    includeCharts: true,
    includeExecutiveSummary: true,
    includeRecommendations: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced' | 'templates' | 'ai'>('quick');

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      format: 'pdf',
      icon: <FileText className="w-5 h-5" />,
      description: 'Professional document with charts and tables',
    },
    {
      id: 'csv',
      name: 'CSV Export',
      format: 'csv',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      description: 'Raw data for spreadsheet analysis',
    },
    {
      id: 'png',
      name: 'PNG Chart',
      format: 'png',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'High-quality chart image',
    },
    {
      id: 'svg',
      name: 'SVG Vector',
      format: 'svg',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Scalable vector graphics',
    },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/reports/templates');
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsGenerating(true);
    try {
      let endpoint = '';
      let body = {};

      switch (selectedFormat) {
        case 'pdf':
          endpoint = '/api/reports/generate/pdf';
          body = {
            reportConfig: {
              name: 'Election Analysis Report',
              description: 'Comprehensive election analysis',
              templateId: exportConfig.templateId,
              format: 'pdf',
              includeCharts: exportConfig.includeCharts,
              includeExecutiveSummary: exportConfig.includeExecutiveSummary,
              includeRecommendations: exportConfig.includeRecommendations,
              dataScope: {},
            },
            data: { /* mock data */ },
          };
          break;
        case 'csv':
          endpoint = '/api/reports/export/csv';
          body = {
            reportConfig: { name: 'Data Export' },
            data: { /* mock data */ },
          };
          break;
        case 'png':
        case 'svg':
          endpoint = `/api/reports/export/chart/${selectedFormat}`;
          body = {
            config: {
              chartId: 'chart-1',
              format: selectedFormat,
              width: 800,
              height: 600,
              quality: 'high',
            },
            chartData: { /* mock chart data */ },
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      setExportResult(result.data);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAISummary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { /* mock data */ } }),
      });

      const result = await response.json();
      setExportResult(result.data);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const duplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/reports/templates/${templateId}/duplicate`, {
        method: 'POST',
      });
      const result = await response.json();
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      await fetch(`/api/reports/templates/${templateId}`, {
        method: 'DELETE',
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Export</h1>
                <p className="text-sm text-gray-500">Generate and export professional reports</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'quick', label: 'Quick Export', icon: Download },
              { id: 'advanced', label: 'Advanced', icon: Settings },
              { id: 'templates', label: 'Templates', icon: LayoutTemplate },
              { id: 'ai', label: 'AI Summary', icon: Wand2 },
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'quick' && (
          <div className="space-y-6">
            {/* Export Format Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Export Format</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {exportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.format as any)}
                    className={`p-6 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                      selectedFormat === option.format ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        selectedFormat === option.format ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium text-gray-900">{option.name}</h3>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            {selectedFormat === 'pdf' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h2>
                <select
                  value={exportConfig.templateId}
                  onChange={(e) => setExportConfig({ ...exportConfig, templateId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Options */}
            {selectedFormat === 'pdf' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeCharts}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeCharts: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Include Charts</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeExecutiveSummary}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeExecutiveSummary: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Include Executive Summary</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeRecommendations}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeRecommendations: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Include Recommendations</span>
                  </label>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {selectedFormat && (
              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate Export
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Export Result */}
            {exportResult && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Export Generated Successfully</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">Format: <span className="font-medium">{exportResult.format.toUpperCase()}</span></p>
                  <p className="text-gray-600">Size: <span className="font-medium">{(exportResult.size / 1024).toFixed(2)} KB</span></p>
                  <a
                    href={exportResult.url}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Report Templates</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    {!template.isDefault && (
                      <>
                        <button
                          onClick={() => duplicateTemplate(template.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-3 h-3" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI-Generated Executive Summary</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Generate a comprehensive executive summary using AI analysis of your election data.
              </p>
              <button
                onClick={generateAISummary}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate AI Summary
                  </>
                )}
              </button>
            </div>

            {exportResult && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{exportResult.title}</h3>
                <p className="text-gray-600 mb-4">{exportResult.overview}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                  <ul className="space-y-2">
                    {exportResult.keyFindings?.map((finding: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{finding.title}</p>
                          <p className="text-sm text-gray-600">{finding.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {exportResult.recommendations?.map((rec: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{rec.title}</p>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Advanced Export Options</h2>
            </div>
            <p className="text-gray-600">Advanced export configuration options coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};
