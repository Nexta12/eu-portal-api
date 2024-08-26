import { Request, Response } from 'express';

export const healthCheckController = (_: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is up and running'
  });
};
