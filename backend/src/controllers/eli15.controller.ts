import { Request, Response, NextFunction } from 'express';
import { ELI15Service } from '../services/eli15.service';

/**
 * ELI15 Controller
 * Handles API endpoints for Explain Like I'm 15 feature
 */

const eli15Service = new ELI15Service();

export class ELI15Controller {
  /**
   * Simplify analytics data
   */
  async simplifyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Analytics data array is required',
          },
        });
      }

      const explanation = await eli15Service.simplifyAnalytics(data);

      res.json({
        success: true,
        data: explanation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simplify election data
   */
  async simplifyElectionData(req: Request, res: Response, next: NextFunction) {
    try {
      const { election } = req.body;

      if (!election) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Election data is required',
          },
        });
      }

      const explanation = await eli15Service.simplifyElectionData(election);

      res.json({
        success: true,
        data: explanation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Simplify a concept
   */
  async simplifyConcept(req: Request, res: Response, next: NextFunction) {
    try {
      const { concept, context } = req.body;

      if (!concept) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Concept is required',
          },
        });
      }

      const explanation = await eli15Service.simplifyConcept(concept, context);

      res.json({
        success: true,
        data: explanation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate step-by-step explanation
   */
  async generateStepByStep(req: Request, res: Response, next: NextFunction) {
    try {
      const { process, steps } = req.body;

      if (!process || !steps || !Array.isArray(steps)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Process and steps array are required',
          },
        });
      }

      const explanation = await eli15Service.generateStepByStepExplanation(process, steps);

      res.json({
        success: true,
        data: explanation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate quiz question
   */
  async generateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, explanation } = req.body;

      if (!topic) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Topic is required',
          },
        });
      }

      const quiz = await eli15Service.generateQuizQuestion(topic, explanation);

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get glossary entry
   */
  async getGlossaryEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.params;

      if (!term) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Term is required',
          },
        });
      }

      const entry = await eli15Service.generateGlossaryEntry(term);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate learning module
   */
  async generateLearningModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic } = req.params;

      if (!topic) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Topic is required',
          },
        });
      }

      const module = await eli15Service.generateLearningModule(topic);

      res.json({
        success: true,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const eli15Controller = new ELI15Controller();
