import { ExcelParser } from '../parsers/excel.parser';
import prisma from '../../../common/database/prisma';
import { UploadRepository } from '../../upload/repositories/upload.repository';
import { FileStatus } from '@prisma/client';

export class ExcelService {
  private parser: ExcelParser;
  private uploadRepository: UploadRepository;

  constructor() {
    this.parser = new ExcelParser();
    this.uploadRepository = new UploadRepository();
  }

  async processFile(fileId: string, filePath: string) {
    try {
      // 1. Update status ke IN_PROGRESS
      await this.uploadRepository.updateStatus(fileId, FileStatus.IN_PROGRESS);

      // 2. Parse Excel
      const rawData = this.parser.parse(filePath);

      // 3. Simpan ke database (Batch Insert ke table Product sebagai contoh)
      // Kita asumsikan kolomnya: name, price, sku, description, category
      const products = (rawData as any[]).map((row) => ({
        name: row.name || 'Unnamed Product',
        price: parseFloat(row.price) || 0,
        sku: row.sku?.toString() || null,
        description: row.description || null,
        category: row.category || null,
      }));

      // Menggunakan createMany untuk efisiensi
      await prisma.product.createMany({
        data: products,
        skipDuplicates: true,
      });

      // 4. Update status ke SUCCESS
      await this.uploadRepository.updateStatus(fileId, FileStatus.SUCCESS, undefined, new Date());

      // Update metadata data dengan jumlah row
      await prisma.fileUpload.update({
        where: { id: fileId },
        data: {
          data: { count: products.length },
        },
      });

      return { success: true, count: products.length };
    } catch (error: any) {
      console.error(`Error processing file ${fileId}:`, error);

      // 5. Update status ke FAILED
      await this.uploadRepository.updateStatus(fileId, FileStatus.FAILED, error.message);

      throw error;
    }
  }
}
