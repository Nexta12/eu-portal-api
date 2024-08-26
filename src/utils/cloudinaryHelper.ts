import { CLOUDINARY_FILE_FOLDER, CLOUDINARY_IMAGE_FOLDER } from '../middleware';

export type CloudinaryUrlType = 'file' | 'picture';

export const isCloudinaryUrl = (url: string): boolean => {
  const cloudinaryUrlPattern = /^https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\//;
  return cloudinaryUrlPattern.test(url);
};

export const extractPublicIdFromUrl = (
  cloudinaryUrl: string,
  type: CloudinaryUrlType
): string | null => {
  const parts = cloudinaryUrl.split('/');
  const lastPart = parts.at(-1);
  const extensionIndex = lastPart.lastIndexOf('.');
  const folderPath = type === 'file' ? CLOUDINARY_FILE_FOLDER : CLOUDINARY_IMAGE_FOLDER;

  if (extensionIndex !== -1) {
    return `${folderPath}/${lastPart.slice(0, extensionIndex)}`;
  }

  return isCloudinaryUrl(cloudinaryUrl) ? lastPart : null;
};
