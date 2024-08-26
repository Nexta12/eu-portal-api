import { body } from 'express-validator';

export const createblogValRule = () => [
    body('title', 'Blog title is required').isString().trim().notEmpty(),
    body('content', 'Blog Content is required').isString().trim().notEmpty(),
];

