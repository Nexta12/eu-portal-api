import { body, query } from 'express-validator';

export const getCoursesValidationRules = () => [
  query('group', 'group should be a boolean').optional().isBoolean(),
  query('limit', 'limit should be a number').optional().isNumeric()
];

export const createCourseValidationRules = () => [
  body('name', 'name is required').isString().notEmpty(),
  body('code', 'code is required').isString().notEmpty(),
  body('unit', 'unit is required').isNumeric().notEmpty(),
  body('costUsd', 'costUsd is required').isNumeric().notEmpty(),
  body('programme', 'programme is required').notEmpty(),
  body('isCompulsory', 'isCompulsory should be true or false').isBoolean().notEmpty(),
  body('level', 'level should be 100L, 200L, 300L, 400L or 500L')
    .isIn(['100L', '200L', '300L', '400L', '500L'])
    .notEmpty(),
  body('semester', 'semester should be first or second').isIn(['first', 'second']).notEmpty(),
  body('cohort', 'cohort should be certificate, diploma, degree or postgraduate')
    .isIn(['certificate', 'diploma', 'degree', 'postgraduate'])
    .notEmpty()
];

export const updateCourseValidationRules = () => [
  body('isCompulsory', 'isCompulsory should be true or false').optional().isBoolean(),
  body('level', 'level should be 100L, 200L, 300L, 400L or 500L')
    .optional()
    .isIn(['100L', '200L', '300L', '400L', '500L']),
  body('semester', 'semester should be first or second').optional().isIn(['first', 'second']),
  body('cohort', 'cohort should be certificate, diploma, degree or postgraduate')
    .optional()
    .isIn(['certificate', 'diploma', 'degree', 'postgraduate'])
];
