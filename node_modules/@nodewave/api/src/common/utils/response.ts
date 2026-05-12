import { Response } from 'express';

// Format standard response API
export const successResponse = (res: Response, data: any, message = 'Success', code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res: Response, message = 'Error', code = 500, errors: any = null) => {
  return res.status(code).json({
    success: false,
    message,
    errors,
  });
};
