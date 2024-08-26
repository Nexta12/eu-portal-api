import { Request } from 'express';

import { AdmissionStatus, UserRole } from '../entities';

export type JwtPayload = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  admissionStatus?: AdmissionStatus;
};

export interface IExtendedRequest extends Request {
  jwtPayload?: JwtPayload;
  uploadedFile?: any;
  blogImage?: string;
}
