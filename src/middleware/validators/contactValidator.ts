import { body } from 'express-validator';

export const createContactRule = () => [
    body('firstName', 'Your name is required').isString().notEmpty().trim(),
    body('lastName', 'Your name is required').isString().notEmpty().trim(),
    body('email', 'This must be a valid email address').isEmail().notEmpty().trim(),
    body('message', 'Message content is required').isString().notEmpty(),
];

