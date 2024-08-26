/* eslint-disable consistent-return */
import { NextFunction, Response } from 'express';

import multer from 'multer';

import * as stream from 'node:stream';

import cloudinaryClient from '../../config/cloudinaryClient';
import envConfig from '../../config/envConfig';
import { logger } from '../../services';
import { IExtendedRequest } from '../../types/JwtPayload';
import { HTTP_STATUS, MAX_FILE_SIZE } from '../../utils';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

export const uploadImage = upload.single('picture');
export const CLOUDINARY_IMAGE_FOLDER = `eua/${envConfig.NODE_ENV}/students/pictures`;

export const processAndUploadImage = async (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName } = req.jwtPayload;
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: 'No file uploaded' });
    }

    const imagePublicId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_picture_${Date.now()}`;

    req.uploadedFile = await new Promise((resolve, reject) => {
      const uploadStream = cloudinaryClient.uploader.upload_stream(
        {
          public_id: imagePublicId,
          folder: CLOUDINARY_IMAGE_FOLDER,
          allowed_formats: ['jpg', 'png', 'jpeg']
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      );

      const readableStream = stream.Readable.from(req.file.buffer);
      readableStream.pipe(uploadStream);
    });

    next();
  } catch (error) {
    logger.error(error);
    if (error instanceof multer.MulterError) {
      return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: error.message });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
