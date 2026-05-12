import prisma from '../../../common/database/prisma';
import { FileStatus } from '@prisma/client';

export class FileRepository {
  async findAll(params: {
    userId: number;
    page: number;
    limit: number;
    status?: FileStatus;
    search?: string;
  }) {
    const { userId, page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.filename = {
        contains: search,
      };
    }

    const [data, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fileUpload.count({ where }),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
