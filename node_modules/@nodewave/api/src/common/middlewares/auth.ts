import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { errorResponse } from '../utils/response';

// Middleware untuk proteksi route dengan JWT
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized: No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Unauthorized: Invalid token', 401);
  }
};
