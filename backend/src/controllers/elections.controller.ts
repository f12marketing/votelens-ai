import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { electionService } from '../services/election.service';
import { CreateElectionDto, UpdateElectionDto, GetElectionsDto } from '../dto/election.dto';

export class ElectionController extends BaseController {
  async listElections(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetElectionsDto;
      const result = await electionService.getElections(query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createElection(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateElectionDto = req.body;
      const election = await electionService.createElection(dto);
      this.success(res, election, 201);
    } catch (error) {
      next(error);
    }
  }

  async getElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const election = await electionService.getElectionById(id);
      this.success(res, election);
    } catch (error) {
      next(error);
    }
  }

  async updateElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateElectionDto = req.body;
      const election = await electionService.updateElection(id, dto);
      this.success(res, election);
    } catch (error) {
      next(error);
    }
  }

  async deleteElection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await electionService.deleteElection(id);
      this.success(res, { message: 'Election deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const electionsController = new ElectionController();
