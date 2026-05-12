import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const controller = new AuthController();

// Route untuk registrasi dan login
router.post('/register', controller.register);
router.post('/login', controller.login);

export default router;
