import { body, query } from 'express-validator';

export const createProgrammeValidationRules = () => [
  body('name', 'programme name should be a string').isString().notEmpty(),
  body('durationInMonths', 'durationInMonth should be a number').isNumeric().notEmpty(),
  body('faculty', 'faculty is required').notEmpty(),
  body('isCertificate', 'isCertificate should be a boolean').optional().isBoolean(),
  body('isDiploma', 'isDiploma should be a boolean').optional().isBoolean(),
  body('isDegree', 'isDegree should be a boolean').optional().isBoolean()
];

export const getProgrammeCoursesValidationRules = () => [
  query('cohort', 'cohort should be certificate, diploma, degree or postgraduate')
    .optional()
    .isIn(['certificate', 'diploma', 'degree', 'postgraduate'])
];

export const getProgrammesValidationRules = () => [
  query('withFaculty', 'withFaculty should be true or false').optional().isBoolean()
];

export const updateProgrammeValidationRules = () => [
  body('name', 'programme name should be a string').optional().isString().notEmpty(),
  body('isCertificate', 'isCertificate should be a boolean').optional().isBoolean(),
  body('isDiploma', 'isDiploma should be a boolean').optional().isBoolean(),
  body('isDegree', 'isDegree should be a boolean').optional().isBoolean()
];
