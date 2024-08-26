import { body } from 'express-validator';

import { MINIMUM_PASSWORD_LENGTH } from '../../utils';

export const createStaffValidationRules = () => [
  body('firstName', 'firstName must be a string').isString(),
  body('lastName', 'lastName must be a string').isString(),
  body('email', 'This must be a valid email address').isEmail(),
  body('password', `Password must have a minimum length of ${MINIMUM_PASSWORD_LENGTH}`).isLength({
    min: MINIMUM_PASSWORD_LENGTH
  }),
  body('role')
    .optional()
    .isIn(['admin', 'staff'])
    .withMessage('Role must be either admin or staff')
];

export const updateStaffValidationRules = () => [
  body('role').optional().isIn(['admin', 'staff']).withMessage('Role must be either admin or staff')
];
