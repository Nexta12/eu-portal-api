import { body } from 'express-validator';

export const createFacultyValidationRules = () => [body('name', 'name is required').isString()];
