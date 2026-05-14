import { fileQueue } from '../../../common/queue/bull';
import { ExcelService } from '../services/excel.service';

const excelService = new ExcelService();

// Worker process untuk menangani job dari antrian
export const initExcelWorker = () => {
  console.log('Excel Worker initialized and waiting for jobs...');

  fileQueue.process(async (job) => {
    const { fileId, filePath } = job.data;
    console.log(`Processing job for file: ${fileId}`);

    return await excelService.processFile(fileId, filePath);
  });

  fileQueue.on('completed', (job, result) => {
    console.log(`Job completed for file ${job.data.fileId}:`, result);
  });

  fileQueue.on('failed', (job, err) => {
    console.error(`Job failed for file ${job.data.fileId}:`, err.message);
  });
};
