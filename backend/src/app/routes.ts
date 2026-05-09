import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { electionsController } from '../controllers/elections.controller';
import { uploadController } from '../controllers/upload.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { insightController } from '../controllers/insight.controller';
import { reportController } from '../controllers/report.controller';
import { constituencyController } from '../controllers/constituency.controller';
import { aiController } from '../controllers/ai.controller';
import { insightGenerationController } from '../controllers/insight-generation.controller';
import { chatController } from '../controllers/chat.controller';
import { comparisonController } from '../controllers/comparison.controller';
import { analyticsWorkspaceController } from '../controllers/analytics-workspace.controller';
import { adminController } from '../controllers/admin.controller';
import { anchorController } from '../controllers/anchor.controller';
import { eli15Controller } from '../controllers/eli15.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';
import { authRateLimiter, uploadRateLimiter, createApiRateLimiter } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from '../dto/auth.dto';
import { uploadSchema, getUploadsSchema } from '../dto/upload.dto';
import { getAnalyticsSchema, getAdvancedAnalyticsSchema } from '../dto/analytics.dto';
import { getInsightsSchema, generateInsightSchema } from '../dto/insight.dto';
import { createReportSchema, getReportsSchema } from '../dto/report.dto';
import { createConstituencySchema, updateConstituencySchema, getConstituenciesSchema } from '../dto/constituency.dto';
import { createElectionSchema, updateElectionSchema, getElectionsSchema } from '../dto/election.dto';
import { UserRole } from '../types';

const router = Router();

// Auth routes (public)
router.post('/auth/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/auth/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/auth/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refresh.bind(authController));
router.get('/auth/me', authenticate, authController.getMe.bind(authController));
router.post('/auth/logout', authenticate, authController.logout.bind(authController));

// Elections routes
router.get('/elections', optionalAuth, validate(getElectionsSchema), electionsController.listElections.bind(electionsController));
router.post('/elections', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), validate(createElectionSchema), electionsController.createElection.bind(electionsController));
router.get('/elections/:id', optionalAuth, electionsController.getElection.bind(electionsController));
router.put('/elections/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), validate(updateElectionSchema), electionsController.updateElection.bind(electionsController));
router.delete('/elections/:id', authenticate, authorize(UserRole.ADMIN), electionsController.deleteElection.bind(electionsController));

// Uploads routes
router.post('/uploads', authenticate, uploadRateLimiter, uploadController.createUpload.bind(uploadController));
router.post('/uploads/validate', authenticate, uploadController.validateUpload.bind(uploadController));
router.post('/uploads/confirm', authenticate, uploadController.confirmImport.bind(uploadController));
router.get('/uploads', authenticate, validate(getUploadsSchema), uploadController.getUploads.bind(uploadController));
router.get('/uploads/:id', authenticate, uploadController.getUploadById.bind(uploadController));
router.get('/uploads/:id/progress', authenticate, uploadController.getUploadProgress.bind(uploadController));
router.delete('/uploads/:id', authenticate, uploadController.deleteUpload.bind(uploadController));

// Analytics routes
router.get('/analytics/metrics', authenticate, validate(getAnalyticsSchema), analyticsController.getMetrics.bind(analyticsController));
router.get('/analytics/advanced', authenticate, authorize(UserRole.ANALYST, UserRole.ADMIN), validate(getAdvancedAnalyticsSchema), analyticsController.getAdvancedAnalytics.bind(analyticsController));
router.get('/analytics/constituency/:id', authenticate, analyticsController.getConstituencyAnalytics.bind(analyticsController));
router.get('/analytics/election/:id', authenticate, analyticsController.getElectionAnalytics.bind(analyticsController));
router.get('/analytics/election/:id/turnout', authenticate, analyticsController.getTurnoutAnalysis.bind(analyticsController));
router.get('/analytics/election/:id/vote-share', authenticate, analyticsController.getVoteShareAnalysis.bind(analyticsController));
router.get('/analytics/election/:id/seat-distribution', authenticate, analyticsController.getSeatDistribution.bind(analyticsController));
router.get('/analytics/election/:id/ranking', authenticate, analyticsController.getConstituencyRanking.bind(analyticsController));
router.get('/analytics/election/:id/swing', authenticate, analyticsController.getSwingAnalysis.bind(analyticsController));
router.get('/analytics/election/:id/historical', authenticate, analyticsController.getHistoricalComparison.bind(analyticsController));
router.get('/analytics/election/:id/close-contests', authenticate, analyticsController.getCloseContests.bind(analyticsController));
router.get('/analytics/election/:id/regional', authenticate, analyticsController.getRegionalAnalysis.bind(analyticsController));

// AI Insights routes
router.get('/insights', authenticate, validate(getInsightsSchema), insightController.getInsights.bind(insightController));
router.get('/insights/:id', authenticate, insightController.getInsightById.bind(insightController));
router.post('/insights/generate', authenticate, authorize(UserRole.ANALYST, UserRole.ADMIN), validate(generateInsightSchema), insightController.generateInsight.bind(insightController));
router.delete('/insights/:id', authenticate, authorize(UserRole.ADMIN), insightController.deleteInsight.bind(insightController));

// Reports routes
router.post('/reports', authenticate, validate(createReportSchema), reportController.createReport.bind(reportController));
router.get('/reports', authenticate, validate(getReportsSchema), reportController.getReports.bind(reportController));
router.get('/reports/:id', authenticate, reportController.getReportById.bind(reportController));
router.get('/reports/:id/download', authenticate, reportController.downloadReport.bind(reportController));
router.delete('/reports/:id', authenticate, reportController.deleteReport.bind(reportController));

// Report Generation and Export routes
router.post('/reports/generate/pdf', authenticate, reportController.generatePDFReport.bind(reportController));
router.post('/reports/export/csv', authenticate, reportController.generateCSVExport.bind(reportController));
router.post('/reports/export/csv/constituency', authenticate, reportController.generateConstituencyCSV.bind(reportController));
router.post('/reports/export/csv/analytics', authenticate, reportController.generateAnalyticsCSV.bind(reportController));
router.post('/reports/export/chart/png', authenticate, reportController.exportChartAsPNG.bind(reportController));
router.post('/reports/export/chart/svg', authenticate, reportController.exportChartAsSVG.bind(reportController));
router.post('/reports/export/chart/pdf', authenticate, reportController.exportChartAsPDF.bind(reportController));
router.post('/reports/export/chart/batch', authenticate, reportController.batchExportCharts.bind(reportController));

// AI Executive Summary routes
router.post('/reports/ai/summary', authenticate, reportController.generateExecutiveSummary.bind(reportController));
router.post('/reports/ai/findings', authenticate, reportController.generateKeyFindings.bind(reportController));
router.post('/reports/ai/recommendations', authenticate, reportController.generateRecommendations.bind(reportController));

// Report Template routes
router.get('/reports/templates', authenticate, reportController.getTemplates.bind(reportController));
router.get('/reports/templates/:id', authenticate, reportController.getTemplateById.bind(reportController));
router.get('/reports/templates/type/:type', authenticate, reportController.getTemplatesByType.bind(reportController));
router.post('/reports/templates', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), reportController.createTemplate.bind(reportController));
router.put('/reports/templates/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), reportController.updateTemplate.bind(reportController));
router.delete('/reports/templates/:id', authenticate, authorize(UserRole.ADMIN), reportController.deleteTemplate.bind(reportController));
router.post('/reports/templates/:id/duplicate', authenticate, reportController.duplicateTemplate.bind(reportController));

// Export utilities
router.get('/reports/export/formats', authenticate, reportController.getSupportedChartFormats.bind(reportController));
router.get('/reports/export/csv/templates', authenticate, reportController.getCSVExportTemplates.bind(reportController));
router.get('/reports/health', reportController.healthCheck.bind(reportController));

// Constituencies routes
router.get('/constituencies', optionalAuth, validate(getConstituenciesSchema), constituencyController.getConstituencies.bind(constituencyController));
router.post('/constituencies', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), validate(createConstituencySchema), constituencyController.createConstituency.bind(constituencyController));
router.get('/constituencies/:id', optionalAuth, constituencyController.getConstituencyById.bind(constituencyController));
router.put('/constituencies/:id', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), validate(updateConstituencySchema), constituencyController.updateConstituency.bind(constituencyController));
router.delete('/constituencies/:id', authenticate, authorize(UserRole.ADMIN), constituencyController.deleteConstituency.bind(constituencyController));

// AI Analysis routes
router.post('/ai/summary/election', authenticate, aiController.generateElectionSummary.bind(aiController));
router.post('/ai/summary/executive', authenticate, aiController.generateExecutiveSummary.bind(aiController));
router.post('/ai/trends/turnout', authenticate, aiController.analyzeTurnoutTrends.bind(aiController));
router.post('/ai/trends/party', authenticate, aiController.analyzePartyPerformance.bind(aiController));
router.post('/ai/anomalies/detect', authenticate, aiController.detectAnomalies.bind(aiController));
router.post('/ai/anomalies/fraud', authenticate, authorize(UserRole.ADMIN, UserRole.ANALYST), aiController.analyzeFraudIndicators.bind(aiController));
router.post('/ai/constituency/analyze', authenticate, aiController.analyzeConstituency.bind(aiController));
router.post('/ai/constituency/swing', authenticate, aiController.analyzeSwingConstituency.bind(aiController));
router.post('/ai/explain/beginner', authenticate, aiController.explainToBeginner.bind(aiController));
router.post('/ai/explain/metric', authenticate, aiController.explainComplexMetric.bind(aiController));
router.post('/ai/query/natural', authenticate, aiController.handleNaturalLanguageQuery.bind(aiController));
router.post('/ai/query/comparative', authenticate, aiController.performComparativeAnalysis.bind(aiController));
router.post('/ai/custom', authenticate, aiController.customAnalysis.bind(aiController));
router.delete('/ai/cache', authenticate, authorize(UserRole.ADMIN), aiController.clearCache.bind(aiController));
router.get('/ai/cache/stats', authenticate, authorize(UserRole.ADMIN), aiController.getCacheStats.bind(aiController));
router.get('/ai/health', aiController.healthCheck.bind(aiController));
router.get('/ai/templates', authenticate, aiController.getAvailableTemplates.bind(aiController));
router.get('/ai/templates/:category', authenticate, aiController.getTemplatesByCategory.bind(aiController));

// Insight Generation routes
router.post('/insights/generate', authenticate, authorize(UserRole.ANALYST, UserRole.ADMIN), insightGenerationController.generateInsights.bind(insightGenerationController));
router.post('/insights/:id/regenerate', authenticate, authorize(UserRole.ANALYST, UserRole.ADMIN), insightGenerationController.regenerateInsight.bind(insightGenerationController));
router.get('/insights/generation/health', insightGenerationController.healthCheck.bind(insightGenerationController));

// Chat AI routes
router.post('/chat/query', authenticate, chatController.processQuery.bind(chatController));
router.post('/chat/query/ai', authenticate, chatController.processQueryWithAI.bind(chatController));
router.get('/chat/conversations/:id/history', authenticate, chatController.getConversationHistory.bind(chatController));
router.delete('/chat/conversations/:id', authenticate, chatController.clearConversation.bind(chatController));
router.get('/chat/suggestions', authenticate, chatController.getQuerySuggestions.bind(chatController));
router.get('/chat/health', chatController.healthCheck.bind(chatController));

// Historical Comparison routes
router.post('/comparisons/compare', authenticate, comparisonController.compareElections.bind(comparisonController));
router.get('/comparisons/elections', authenticate, comparisonController.getAvailableElections.bind(comparisonController));
router.get('/comparisons/filters', authenticate, comparisonController.getFilterOptions.bind(comparisonController));
router.get('/comparisons/health', comparisonController.healthCheck.bind(comparisonController));

// Analytics Workspace routes
router.post('/analytics/workspaces', authenticate, analyticsWorkspaceController.createWorkspace.bind(analyticsWorkspaceController));
router.get('/analytics/workspaces', authenticate, analyticsWorkspaceController.listWorkspaces.bind(analyticsWorkspaceController));
router.get('/analytics/workspaces/:id', authenticate, analyticsWorkspaceController.getWorkspace.bind(analyticsWorkspaceController));
router.put('/analytics/workspaces/:id', authenticate, analyticsWorkspaceController.updateWorkspace.bind(analyticsWorkspaceController));
router.delete('/analytics/workspaces/:id', authenticate, analyticsWorkspaceController.deleteWorkspace.bind(analyticsWorkspaceController));
router.post('/analytics/workspaces/:id/export', authenticate, analyticsWorkspaceController.exportWorkspace.bind(analyticsWorkspaceController));
router.get('/analytics/export/formats', authenticate, analyticsWorkspaceController.getExportFormats.bind(analyticsWorkspaceController));
router.get('/analytics/filters/suggestions', authenticate, analyticsWorkspaceController.getFilterSuggestions.bind(analyticsWorkspaceController));
router.get('/analytics/health', analyticsWorkspaceController.healthCheck.bind(analyticsWorkspaceController));

// Admin routes - User Management
router.get('/admin/users', authenticate, requireAdmin, adminController.getAllUsers.bind(adminController));
router.get('/admin/users/:id', authenticate, requireAdmin, adminController.getUserById.bind(adminController));
router.post('/admin/users', authenticate, requireAdmin, adminController.createUser.bind(adminController));
router.put('/admin/users/:id', authenticate, requireAdmin, adminController.updateUser.bind(adminController));
router.delete('/admin/users/:id', authenticate, requireAdmin, adminController.deleteUser.bind(adminController));
router.post('/admin/users/:id/suspend', authenticate, requireAdmin, adminController.suspendUser.bind(adminController));
router.post('/admin/users/:id/activate', authenticate, requireAdmin, adminController.activateUser.bind(adminController));
router.get('/admin/users/statistics', authenticate, requireAdmin, adminController.getUserStatistics.bind(adminController));
router.get('/admin/users/search', authenticate, requireAdmin, adminController.searchUsers.bind(adminController));

// Admin routes - Role Management
router.get('/admin/roles', authenticate, requireAdmin, adminController.getAllRoles.bind(adminController));
router.get('/admin/roles/:id', authenticate, requireAdmin, adminController.getRoleById.bind(adminController));
router.post('/admin/roles', authenticate, requireAdmin, adminController.createRole.bind(adminController));
router.put('/admin/roles/:id', authenticate, requireAdmin, adminController.updateRole.bind(adminController));
router.delete('/admin/roles/:id', authenticate, requireAdmin, adminController.deleteRole.bind(adminController));
router.post('/admin/roles/:id/duplicate', authenticate, requireAdmin, adminController.duplicateRole.bind(adminController));
router.get('/admin/permissions', authenticate, requireAdmin, adminController.getAllPermissions.bind(adminController));
router.get('/admin/permissions/category/:category', authenticate, requireAdmin, adminController.getPermissionsByCategory.bind(adminController));
router.get('/admin/roles/statistics', authenticate, requireAdmin, adminController.getRoleStatistics.bind(adminController));

// Admin routes - Dataset Moderation
router.get('/admin/moderations', authenticate, requireAdmin, adminController.getAllModerations.bind(adminController));
router.get('/admin/moderations/:id', authenticate, requireAdmin, adminController.getModerationById.bind(adminController));
router.post('/admin/moderations/:id/review', authenticate, requireAdmin, adminController.reviewModeration.bind(adminController));
router.post('/admin/moderations/:id/approve', authenticate, requireAdmin, adminController.approveModeration.bind(adminController));
router.post('/admin/moderations/:id/reject', authenticate, requireAdmin, adminController.rejectModeration.bind(adminController));
router.get('/admin/moderations/statistics', authenticate, requireAdmin, adminController.getModerationStatistics.bind(adminController));
router.get('/admin/moderations/pending', authenticate, requireAdmin, adminController.getPendingModerations.bind(adminController));
router.get('/admin/moderations/flagged', authenticate, requireAdmin, adminController.getFlaggedModerations.bind(adminController));
router.get('/admin/moderations/trends', authenticate, requireAdmin, adminController.getModerationTrends.bind(adminController));

// Admin routes - Audit Logs
router.get('/admin/logs', authenticate, requireAdmin, adminController.getAuditLogs.bind(adminController));
router.get('/admin/logs/:id', authenticate, requireAdmin, adminController.getAuditLogById.bind(adminController));
router.get('/admin/logs/user/:userId', authenticate, requireAdmin, adminController.getLogsByUser.bind(adminController));
router.get('/admin/logs/resource/:resource', authenticate, requireAdmin, adminController.getLogsByResource.bind(adminController));
router.get('/admin/logs/recent', authenticate, requireAdmin, adminController.getRecentLogs.bind(adminController));
router.get('/admin/logs/critical', authenticate, requireAdmin, adminController.getCriticalLogs.bind(adminController));
router.get('/admin/logs/statistics', authenticate, requireAdmin, adminController.getLogStatistics.bind(adminController));
router.get('/admin/logs/trends', authenticate, requireAdmin, adminController.getLogTrends.bind(adminController));
router.get('/admin/logs/search', authenticate, requireAdmin, adminController.searchLogs.bind(adminController));
router.get('/admin/logs/export', authenticate, requireAdmin, adminController.exportLogs.bind(adminController));
router.get('/admin/logs/anomalies', authenticate, requireAdmin, adminController.detectAnomalies.bind(adminController));

// Admin routes - Monitoring
router.get('/admin/health', authenticate, requireAdmin, adminController.getSystemHealth.bind(adminController));
router.get('/admin/dashboard', authenticate, requireAdmin, adminController.getAnalyticsDashboard.bind(adminController));
router.get('/admin/monitoring/ai', authenticate, requireAdmin, adminController.getAIUsageMetrics.bind(adminController));
router.get('/admin/monitoring/api', authenticate, requireAdmin, adminController.getAPIUsageMetrics.bind(adminController));
router.get('/admin/health-check', adminController.healthCheck.bind(adminController));

// Anchor Mode routes
router.post('/anchor/trends', authenticate, anchorController.generateTrendCommentary.bind(anchorController));
router.post('/anchor/live', authenticate, anchorController.generateLiveSummary.bind(anchorController));
router.post('/anchor/conversational', authenticate, anchorController.generateConversationalCommentary.bind(anchorController));
router.post('/anchor/realtime', authenticate, anchorController.generateRealtimeCommentary.bind(anchorController));
router.post('/anchor/broadcast', authenticate, anchorController.generateBroadcastScript.bind(anchorController));
router.post('/anchor/voice', authenticate, anchorController.getVoiceReadyText.bind(anchorController));
router.post('/anchor/constituency', authenticate, anchorController.generateConstituencyCommentary.bind(anchorController));
router.post('/anchor/comparative', authenticate, anchorController.generateComparativeCommentary.bind(anchorController));
router.get('/anchor/presets', optionalAuth, anchorController.getPresets.bind(anchorController));

// ELI15 routes
router.post('/eli15/analytics', authenticate, eli15Controller.simplifyAnalytics.bind(eli15Controller));
router.post('/eli15/election', authenticate, eli15Controller.simplifyElectionData.bind(eli15Controller));
router.post('/eli15/concept', authenticate, eli15Controller.simplifyConcept.bind(eli15Controller));
router.post('/eli15/steps', authenticate, eli15Controller.generateStepByStep.bind(eli15Controller));
router.post('/eli15/quiz', authenticate, eli15Controller.generateQuiz.bind(eli15Controller));
router.get('/eli15/glossary/:term', optionalAuth, eli15Controller.getGlossaryEntry.bind(eli15Controller));
router.get('/eli15/learn/:topic', optionalAuth, eli15Controller.generateLearningModule.bind(eli15Controller));

export { router as routes };
