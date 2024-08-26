import { body } from 'express-validator';

export const createReportValRule = () => [
    body('subject', 'Subject is required').isString().notEmpty(),
    body('message', 'Message is required').isString().notEmpty(),
];

