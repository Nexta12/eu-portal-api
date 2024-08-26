import { Router } from 'express';

import {
  checkForDuplicateEmail,
  forgotPassword,
  handleChangePassword,
  login,
  resetPassword,
  validateAuthentication,
  chatBoxSignUp
} from '../controllers';
import {
  changePasswordValidationRules,
  chatLoginValidator,
  checkJwt,
  forgotPasswordValidationRules,
  loginValidationRules,
  resetPasswordValidationRules,
  validate
} from '../middleware';

const router = Router();

router.post('/login', loginValidationRules(), validate, login);

router.put(
  '/change-password',
  checkJwt,
  changePasswordValidationRules(),
  validate,
  handleChangePassword
);
router.post('/chat-user', chatLoginValidator(), validate, chatBoxSignUp )
router.get('/email/:email', checkForDuplicateEmail);

router.get('/validate', checkJwt, validateAuthentication);

// todo: write test for this route
router.post('/forgot-password', forgotPasswordValidationRules(), validate, forgotPassword);

// todo: write test for this route
router.put('/reset-password', resetPasswordValidationRules(), validate, resetPassword);

export default router;
