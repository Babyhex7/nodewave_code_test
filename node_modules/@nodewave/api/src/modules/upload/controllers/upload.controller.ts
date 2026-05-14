import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

export class UploadController {
  private service: UploadService;

  constructor() {
    this.service = new UploadService();
  }

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const user = (req as any).user;
      const result = await this.service.processUpload(user.id, req.file);

      return successResponse(
        res,
        {
          fileId: result.id,
          status: result.status,
          message: 'File queued for processing',
          checkStatusUrl: `/api/files/${result.id}/status`,
        },
        'Upload success',
        202,
      );
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.getStatus(id);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.retry(id);
      return successResponse(res, result, 'Retry initiated');
    } catch (error) {
      next(error);
    }
  };
}
