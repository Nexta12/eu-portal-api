/* eslint-disable unicorn/prefer-string-replace-all */
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import path from 'node:path';

import { BlogEntity } from '../entities';
import handleGetRepository from './handleGetRepository';

export const generateFiveDigitNumber = () => {
  const randomNumber = Math.floor(Math.random() * 100_000);
  return randomNumber.toString().padStart(5, '0');
};

export const sanitizeFileName = (file: Express.Multer.File) => {
  const originalFileName = file.originalname;
  const baseName = path.basename(originalFileName, path.extname(originalFileName));
  return baseName.replace(/\s+/g, '_');
};

export const generateReferenceNumber = () => {
  const generatedNanoid = nanoid(10).toLowerCase();
  return generatedNanoid.replace(/[^\dA-Za-z]/g, '0');
};

export const generateMatriculationNumber = () => {
  const baseAlphabet = 'EUA';
  const year = new Date().getFullYear().toString().slice(2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const digits = generateFiveDigitNumber();
  return `${baseAlphabet}${year}${month}${digits}`;
};

export const getCurrentAcademicSession = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const nextYear = currentYear + 1;
  return `${currentYear}/${nextYear}`;
};

interface Author {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

interface TransformedAuthor {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export const transformAuthor = (author: Author): TransformedAuthor => ({
  userId: author.userId,
  firstName: author.firstName,
  lastName: author.lastName,
  profilePicture: author.profilePicture
});

export const generateUniqueSlug = async (title: string): Promise<string> => {
  const blogRepository = handleGetRepository(BlogEntity);

  // Generate the initial slug
  const slug = slugify(title, { lower: true, strict: true });
  const existingBlogs = await blogRepository.find({ select: ['slug'] }); // Retrieve only the slugs

  // Collect all existing slugs in a Set for quick lookup
  const existingSlugs = new Set(existingBlogs.map((blog) => blog.slug));

  let counter = 1;
  let uniqueSlug = slug;

  // Generate new slugs until we find a unique one
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter += 1;
  }

  return uniqueSlug;
};

export const getSnippet = (text: string | undefined, wordLimit: number) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) {
    return text;
  }
  return words.slice(0, wordLimit).join(' ');
};
