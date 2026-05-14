import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

// Middleware untuk handle error global
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    message,
    status,
    process.env.NODE_ENV === 'development' ? err.stack : null,
  );
};
