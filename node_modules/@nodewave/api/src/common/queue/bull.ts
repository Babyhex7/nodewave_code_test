import Queue from 'bull';
import { config } from '../config';

// Inisialisasi queue untuk processing Excel
export const fileQueue = new Queue('excel-processing', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  }
});
