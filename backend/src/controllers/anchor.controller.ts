import { Request, Response, NextFunction } from 'express';
import { AnchorService } from '../services/anchor.service';

/**
 * Anchor Controller
 * Handles API endpoints for AI Anchor Mode feature
 */

const anchorService = new AnchorService();

export class AnchorController {
  /**
   * Generate commentary for election trends
   */
  async generateTrendCommentary(req: Request, res: Response, next: NextFunction) {
    try {
      const { trends, config } = req.body;

      if (!trends || !Array.isArray(trends)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Trends array is required',
          },
        });
      }

      const commentaries = await anchorService.generateTrendCommentary(trends, config || {});

      res.json({
        success: true,
        data: commentaries,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate live analytics summary
   */
  async generateLiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { analytics, config } = req.body;

      if (!analytics) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Analytics data is required',
          },
        });
      }

      const commentary = await anchorService.generateLiveSummary(analytics, config || {});

      res.json({
        success: true,
        data: commentary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate conversational election commentary
   */
  async generateConversationalCommentary(req: Request, res: Response, next: NextFunction) {
    try {
      const { trends, analytics, config } = req.body;

      if (!trends || !analytics) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Trends and analytics data are required',
          },
        });
      }

      const commentaries = await anchorService.generateConversationalCommentary(
        trends,
        analytics,
        config || {}
      );

      res.json({
        success: true,
        data: commentaries,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate real-time commentary for live updates
   */
  async generateRealtimeCommentary(req: Request, res: Response, next: NextFunction) {
    try {
      const { update, config } = req.body;

      if (!update || !update.type) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Update type is required',
          },
        });
      }

      const commentary = await anchorService.generateRealtimeCommentary(update, config || {});

      res.json({
        success: true,
        data: commentary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate complete broadcast script
   */
  async generateBroadcastScript(req: Request, res: Response, next: NextFunction) {
    try {
      const { trends, analytics, config, maxDuration } = req.body;

      if (!trends || !analytics) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Trends and analytics data are required',
          },
        });
      }

      const broadcast = await anchorService.generateBroadcastScript(
        trends,
        analytics,
        config || {},
        maxDuration || 120
      );

      res.json({
        success: true,
        data: broadcast,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate voice-ready text with SSML
   */
  async getVoiceReadyText(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentaries } = req.body;

      if (!commentaries || !Array.isArray(commentaries)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Commentaries array is required',
          },
        });
      }

      const ssml = await anchorService.getVoiceReadyText(commentaries);

      res.json({
        success: true,
        data: {
          ssml,
          format: 'SSML',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate commentary for specific constituency
   */
  async generateConstituencyCommentary(req: Request, res: Response, next: NextFunction) {
    try {
      const { constituency, config } = req.body;

      if (!constituency) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Constituency data is required',
          },
        });
      }

      const commentary = await anchorService.generateConstituencyCommentary(
        constituency,
        config || {}
      );

      res.json({
        success: true,
        data: commentary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate comparative commentary
   */
  async generateComparativeCommentary(req: Request, res: Response, next: NextFunction) {
    try {
      const { current, previous, config } = req.body;

      if (!current || !previous) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Current and previous analytics data are required',
          },
        });
      }

      const commentary = await anchorService.generateComparativeCommentary(
        current,
        previous,
        config || {}
      );

      res.json({
        success: true,
        data: commentary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get anchor configuration presets
   */
  async getPresets(req: Request, res: Response, next: NextFunction) {
    try {
      const presets = {
        news: {
          style: 'news' as const,
          pacing: 'normal' as const,
          detailLevel: 'standard' as const,
          includeNumbers: true,
          includePercentages: true,
          maxDuration: 60,
        },
        sports: {
          style: 'sports' as const,
          pacing: 'fast' as const,
          detailLevel: 'brief' as const,
          includeNumbers: true,
          includePercentages: true,
          maxDuration: 45,
        },
        documentary: {
          style: 'documentary' as const,
          pacing: 'slow' as const,
          detailLevel: 'detailed' as const,
          includeNumbers: true,
          includePercentages: true,
          maxDuration: 120,
        },
      };

      res.json({
        success: true,
        data: presets,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const anchorController = new AnchorController();
