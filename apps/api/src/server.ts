import app from './app';
import { config } from './common/config';
import { initExcelWorker } from './modules/excel/workers/excel.worker';

const port = config.port;

// Initialize Worker
initExcelWorker();

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`[server]: Environment: ${config.env}`);
});
