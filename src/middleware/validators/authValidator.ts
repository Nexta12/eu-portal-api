import { body } from 'express-validator';

import { MINIMUM_PASSWORD_LENGTH } from '../../utils';

const passwordErrorMessage = `Password must have a minimum length of ${MINIMUM_PASSWORD_LENGTH}`;
export const loginValidationRules = () => [
  body('email', 'This must be a valid email address').isEmail(),
  body('password', passwordErrorMessage).isLength({
    min: MINIMUM_PASSWORD_LENGTH
  })
];

export const changePasswordValidationRules = () => [
  body('currentPassword', passwordErrorMessage).isLength({ min: MINIMUM_PASSWORD_LENGTH }),
  body('confirmNewPassword', passwordErrorMessage).isLength({ min: MINIMUM_PASSWORD_LENGTH }),
  body('newPassword').custom((value, { req }) => {
    if (!value) {
      throw new Error('New password is required');
    }

    if (value !== req.body.confirmNewPassword) {
      throw new Error('New password and confirm new password must be the same');
    }
    return true;
  })
];

export const forgotPasswordValidationRules = () => [
  body('email', 'This must be a valid email address').isEmail()
];

export const resetPasswordValidationRules = () => [
  body('userId', 'UserId is required').notEmpty(),
  body('token', 'Token is required').notEmpty(),
  body('newPassword', passwordErrorMessage).isLength({ min: MINIMUM_PASSWORD_LENGTH })
];

export const chatLoginValidator = () => [
  body('name', 'Your Name is Required').notEmpty(),
  body('email', 'Please provide your email').isEmail(),
];
