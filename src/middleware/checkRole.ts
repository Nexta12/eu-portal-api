import { NextFunction, Response } from 'express';

import { IExtendedRequest } from '../types/JwtPayload';
import { Role } from '../types/general';
import { HTTP_STATUS } from '../utils';

export const checkRole =
  (roles: Role[]) => (req: IExtendedRequest, res: Response, next: NextFunction) => {
    const { role } = req.jwtPayload;
    if (roles.includes(role)) next();
    else res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: HTTP_STATUS.FORBIDDEN.message });
  };

