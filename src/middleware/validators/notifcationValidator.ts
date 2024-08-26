import { body } from 'express-validator';

export const noticeValRules = () => [
    body('message', 'Notification message is required').isString().notEmpty(),
    body('title', 'Title is required').isString().notEmpty(),
];

