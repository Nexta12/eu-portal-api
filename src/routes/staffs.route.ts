import { Router } from 'express';

import {
  createStaff,
  deleteStaff,
  getStaffById,
  getStaffs,
  updateStaffRecord
} from '../controllers';
import {
  checkJwt,
  checkRole,
  createStaffValidationRules,
  updateStaffValidationRules,
  validate
} from '../middleware';

const router = Router();

router.get('/', getStaffs);

router.get('/:id', checkJwt, getStaffById);

router.post(
  '/create',
  checkJwt,
  checkRole(['admin']),
  createStaffValidationRules(),
  validate,
  createStaff
);

router.put(
  '/update/:id',
  checkJwt,
  checkRole(['admin', 'staff']),
  updateStaffValidationRules(),
  validate,
  updateStaffRecord
);

router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteStaff);

export default router;
