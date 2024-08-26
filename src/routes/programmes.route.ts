import { Router } from 'express';

import {
  createProgramme,
  deleteProgramme,
  getAllProgrammes,
  getProgrammeById,
  getProgrammeCourses,
  updateProgramme
} from '../controllers';
import {
  checkJwt,
  checkRole,
  createProgrammeValidationRules,
  getProgrammeCoursesValidationRules,
  getProgrammesValidationRules,
  updateProgrammeValidationRules,
  validate
} from '../middleware';

const router = Router();

router.get('/', getProgrammesValidationRules(), validate, getAllProgrammes);

router.get('/:id', getProgrammeById);

router.get('/:id/courses', getProgrammeCoursesValidationRules(), validate, getProgrammeCourses);

router.post(
  '/create',
  checkJwt,
  checkRole(['staff', 'admin']),
  createProgrammeValidationRules(),
  validate,
  createProgramme
);

router.put(
  '/update/:id',
  checkJwt,
  checkRole(['staff', 'admin']),
  updateProgrammeValidationRules(),
  validate,
  updateProgramme
);

router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteProgramme);

export default router;
