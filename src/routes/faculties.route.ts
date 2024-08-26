import { Router } from 'express';

import {
  createFaculty,
  deleteFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty
} from '../controllers';
import { checkJwt, checkRole, createFacultyValidationRules, validate } from '../middleware';

const router = Router();

router.get('/', getAllFaculties);

router.get('/:id', getFacultyById);

router.post(
  '/create',
  checkJwt,
  checkRole(['staff', 'admin']),
  createFacultyValidationRules(),
  validate,
  createFaculty
);

router.put('/update/:id', checkJwt, checkRole(['admin', 'staff']), updateFaculty);

router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteFaculty);

export default router;
