import { UploadRepository } from '../repositories/upload.repository';
import { fileQueue } from '../../../common/queue/bull';
import { FileStatus } from '@prisma/client';

export class UploadService {
  private repository: UploadRepository;

  constructor() {
    this.repository = new UploadRepository();
  }

  async processUpload(userId: number, file: Express.Multer.File) {
    const fileUpload = await this.repository.create({
      filename: file.originalname,
      url: file.path,
      status: FileStatus.PENDING,
      userId,
    });

    // Tambahkan ke antrian Bull
    await fileQueue.add({
      fileId: fileUpload.id,
      filePath: file.path,
      userId,
    });

    return fileUpload;
  }

  async getStatus(fileId: string) {
    const file = await this.repository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    return file;
  }

  async retry(fileId: string) {
    const file = await this.repository.findById(fileId);
    if (!file) throw new Error('File not found');
    if (file.status !== FileStatus.FAILED) throw new Error('Only failed jobs can be retried');

    const updatedFile = await this.repository.incrementRetry(fileId);

    // Tambahkan kembali ke antrian
    await fileQueue.add({
      fileId: updatedFile.id,
      filePath: updatedFile.url,
      userId: updatedFile.userId,
    });

    return updatedFile;
  }
}
