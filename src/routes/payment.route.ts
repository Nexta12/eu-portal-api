import { Router } from 'express';

import {
  getAccountStatement,
  getStudentBalance,
  initializePayment,
  payBill,
  verifyPayment
} from '../controllers';
import { checkJwt, initializePaymentRules, payBillRules, validate } from '../middleware';

const router = Router();

router.post('/initialize', checkJwt, initializePaymentRules(), validate, initializePayment);

router.get('/verify/:reference', checkJwt, verifyPayment);

router.get('/balance', checkJwt, getStudentBalance);

router.put('/pay', checkJwt, payBillRules(), validate, payBill);

router.get('/account-statement', checkJwt, getAccountStatement);

export default router;
