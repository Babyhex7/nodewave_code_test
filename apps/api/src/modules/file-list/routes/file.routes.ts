import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authMiddleware } from '../../../common/middlewares/auth';

const router = Router();
const controller = new FileController();

// Route untuk list file (protected)
router.get('/', authMiddleware, controller.index);

export default router;
