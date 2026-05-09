import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { constituencyService } from '../services/constituency.service';
import { CreateConstituencyDto, UpdateConstituencyDto, GetConstituenciesDto } from '../dto/constituency.dto';

export class ConstituencyController extends BaseController {
  async createConstituency(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateConstituencyDto = req.body;
      const constituency = await constituencyService.createConstituency(dto);
      this.success(res, constituency, 201);
    } catch (error) {
      next(error);
    }
  }

  async getConstituencies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as GetConstituenciesDto;
      const result = await constituencyService.getConstituencies(query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getConstituencyById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const constituency = await constituencyService.getConstituencyById(id);
      this.success(res, constituency);
    } catch (error) {
      next(error);
    }
  }

  async updateConstituency(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateConstituencyDto = req.body;
      const constituency = await constituencyService.updateConstituency(id, dto);
      this.success(res, constituency);
    } catch (error) {
      next(error);
    }
  }

  async deleteConstituency(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await constituencyService.deleteConstituency(id);
      this.success(res, { message: 'Constituency deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const constituencyController = new ConstituencyController();
