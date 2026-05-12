import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../../../common/middlewares/auth';
import { upload } from '../../../common/middlewares/multer';

const router = Router();
const controller = new UploadController();

// Route untuk upload dan status (protected)
router.post('/upload', authMiddleware, upload.single('file'), controller.upload);
router.get('/:id/status', authMiddleware, controller.getStatus);
router.post('/:id/retry', authMiddleware, controller.retry);

export default router;
