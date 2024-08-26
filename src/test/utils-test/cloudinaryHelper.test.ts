import { CloudinaryUrlType, extractPublicIdFromUrl, isCloudinaryUrl } from '../../utils';

const validCloudinaryUrl = [
  {
    url: 'https://res.cloudinary.com/profj001/image/upload/v1691536680/eua/test/students/pictures/Pauline-Malabo-picture-1691536679699.jpg',
    publicId: 'eua/test/students/pictures/Pauline-Malabo-picture-1691536679699',
    type: 'picture'
  }
];

const invalidCloudinaryUrl = [
  {
    url: 'https://invalid-url.com/image/upload/v12345/invalid',
    type: 'picture'
  }
];

describe('CloudinaryHelper', () => {
  describe('extractPublicId', () => {
    it.each(validCloudinaryUrl)(
      'should extract public ID from valid Cloudinary URL',
      ({ url, publicId, type }) => {
        expect(extractPublicIdFromUrl(url, type as CloudinaryUrlType)).toBe(publicId);
      }
    );

    it.each(invalidCloudinaryUrl)(
      'should return null for invalid Cloudinary URL',
      ({ url, type }) => {
        expect(extractPublicIdFromUrl(url, type as CloudinaryUrlType)).toBe(null);
      }
    );
  });

  describe('isCloudinaryUrl', () => {
    it.each(validCloudinaryUrl)('should return true for valid Cloudinary URL', ({ url }) => {
      expect(isCloudinaryUrl(url)).toBe(true);
    });

    it.each(invalidCloudinaryUrl)('should return false for invalid Cloudinary URL', ({ url }) => {
      expect(isCloudinaryUrl(url)).toBe(false);
    });
  });
});
