import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../../../common/utils/response';
import { loginSchema, registerSchema } from '../types';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await this.service.register(validatedData);
      return successResponse(res, user, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const data = await this.service.login(validatedData);
      return successResponse(res, data, 'Login successful');
    } catch (error) {
      next(error);
    }
  };
}
