import { FileRepository } from '../repositories/file.repository';
import { FileStatus } from '@prisma/client';

export class FileService {
  private repository: FileRepository;

  constructor() {
    this.repository = new FileRepository();
  }

  async getFiles(params: {
    userId: number;
    page: number;
    limit: number;
    status?: FileStatus;
    search?: string;
  }) {
    return this.repository.findAll(params);
  }
}
