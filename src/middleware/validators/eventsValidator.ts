import { body } from 'express-validator';

export const createEventValRule = () => [
    body('title', 'Blog title is required').isString().notEmpty(),
    body('description', 'Blog Content is required').isString().notEmpty(),
    body('eventDate', 'Date of Event is required').isString().notEmpty(),
];

