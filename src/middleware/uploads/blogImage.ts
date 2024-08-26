/* eslint-disable consistent-return */
import { NextFunction, Response } from 'express';
import multer from 'multer';
import stream from 'node:stream';
import cloudinaryClient from '../../config/cloudinaryClient';
import envConfig from '../../config/envConfig';
import { logger } from '../../services';
import { IExtendedRequest } from '../../types/JwtPayload';
import { HTTP_STATUS, MAX_FILE_SIZE, sanitizeFileName } from '../../utils';

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

export const uploadBlogImage = upload.single('file');
export const CLOUDINARY_BLOG_IMAGE_FOLDER = `eua/${envConfig.NODE_ENV}/blog/images`;

export const blogImageUploader = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
    try {
        if (req.file) {
            req.body.blogImage = ''; // Initialize Image String

            const imagePublicId = `${sanitizeFileName(req.file)}-${Date.now()}`;
            // Update the file Name to make it unique

            req.uploadedFile = await new Promise((resolve, reject) => {
                const uploadStream = cloudinaryClient.uploader.upload_stream(
                    {
                        public_id: imagePublicId,
                        folder: CLOUDINARY_BLOG_IMAGE_FOLDER,
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

            req.body.blogImage = req.uploadedFile.secure_url; // Set the uploaded file URL to req.body.blogImage
        }

        next();
    } catch (error) {
        logger.error(error);
        if (error instanceof multer.MulterError) {
            return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: error.message });
        }
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
