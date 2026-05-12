import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './common/config';
import { errorHandler } from './common/middlewares/error-handler';

// Import Routes
import authRoutes from './modules/auth/routes/auth.routes';
import uploadRoutes from './modules/upload/routes/upload.routes';
import fileRoutes from './modules/file-list/routes/file.routes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NodeWave Assessment API' });
});

// Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/files`, uploadRoutes);
app.use(`${config.apiPrefix}/files`, fileRoutes);

// Error Handler
app.use(errorHandler);

export default app;
