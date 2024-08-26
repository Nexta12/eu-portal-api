import { body } from 'express-validator';

export const initializePaymentRules = () => [
  body('amount', 'amount is required').isNumeric().notEmpty(),
  body('description', 'description is required').isString().notEmpty()
];

export const payBillRules = () => [body('billId', 'billId is required').notEmpty()];
