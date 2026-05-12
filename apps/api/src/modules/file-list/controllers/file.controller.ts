import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/file.service';
import { successResponse } from '../../../common/utils/response';
import { FileStatus } from '@prisma/client';

export class FileController {
  private service: FileService;

  constructor() {
    this.service = new FileService();
  }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as FileStatus;
      const search = req.query.search as string;

      const result = await this.service.getFiles({
        userId: user.id,
        page,
        limit,
        status,
        search,
      });

      return successResponse(res, result.data, 'Files retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}
