import { NextFunction, Response } from 'express';

import jwt from 'jsonwebtoken';

import { JWT_KEY } from '../config/data';
import { IExtendedRequest, JwtPayload } from '../types/JwtPayload';
import { HTTP_STATUS } from '../utils';

export const checkJwt = (req: IExtendedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(HTTP_STATUS.UNAUTHORIZED.code)
      .send({ message: 'Authorization header not provided' });

  let payload: { [key: string]: any };
  try {
    payload = jwt.verify(token, JWT_KEY) as { [key: string]: any };
    req.jwtPayload = payload as JwtPayload;
    return next();
  } catch {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED.code)
      .send({ message: HTTP_STATUS.UNAUTHORIZED.message });
  }
};
