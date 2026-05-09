import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { uploadService, ParsedUploadData } from '../services/upload.service';
import { UploadDto, GetUploadsDto, ValidateUploadDto, ConfirmImportDto } from '../dto/upload.dto';

export class UploadController extends BaseController {
  async createUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!req.file) {
        throw new Error('No file uploaded');
      }

      const dto: UploadDto = req.body;
      const upload = await uploadService.createUpload(
        userId,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.buffer,
        dto
      );

      this.success(res, upload, 201);
    } catch (error) {
      next(error);
    }
  }

  async validateUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.body as ValidateUploadDto;
      
      // TODO: Retrieve file buffer from temporary storage
      // For now, we'll assume the file is passed in the request
      if (!req.file) {
        throw new Error('No file provided for validation');
      }

      const parsedData = await uploadService.validateUpload(
        fileId,
        req.file.buffer,
        req.file.originalname
      );

      this.success(res, parsedData);
    } catch (error) {
      next(error);
    }
  }

  async confirmImport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const dto: ConfirmImportDto = req.body;
      await uploadService.confirmImport(dto.fileId, userId, dto.electionId, dto.constituencyId);

      this.success(res, { message: 'Import completed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getUploads(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const query = req.query as GetUploadsDto;
      const result = await uploadService.getUploads(userId, query);
      this.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getUploadById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const upload = await uploadService.getUploadById(id);
      this.success(res, upload);
    } catch (error) {
      next(error);
    }
  }

  async getUploadProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const progress = uploadService.getUploadProgress(id);
      
      if (!progress) {
        throw new Error('Upload not found');
      }

      this.success(res, progress);
    } catch (error) {
      next(error);
    }
  }

  async deleteUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await uploadService.deleteUpload(id, userId);
      this.success(res, { message: 'Upload deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
