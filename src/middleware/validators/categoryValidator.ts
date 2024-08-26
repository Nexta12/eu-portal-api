import { body } from 'express-validator';

export const createCategoryValRules = () => [
    body('title', 'Category title is required').isString().toLowerCase().notEmpty(),

];

