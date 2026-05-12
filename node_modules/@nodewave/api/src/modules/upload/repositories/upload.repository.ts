import prisma from '../../../common/database/prisma';
import { FileStatus, Prisma } from '@prisma/client';

export class UploadRepository {
  async create(data: Prisma.FileUploadUncheckedCreateInput) {
    return prisma.fileUpload.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.fileUpload.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: FileStatus, error?: string, processedAt?: Date) {
    return prisma.fileUpload.update({
      where: { id },
      data: { status, error, processedAt },
    });
  }

  async incrementRetry(id: string) {
    return prisma.fileUpload.update({
      where: { id },
      data: { 
        retryCount: { increment: 1 },
        status: FileStatus.PENDING 
      },
    });
  }
}
