import { Router } from 'express';

import {
  getCurrentSemester,
  processAdmission,
  registerForCourse,
  registerForSemester
} from '../controllers';
import {
  checkJwt,
  checkRole,
  processAdmissionValidator,
  updateSemesterCoursesValidator,
  validate
} from '../middleware';

const router = Router();

router.post('/semester-registration', checkJwt, checkRole(['student']), registerForSemester);

router.get('/current-semester', checkJwt, getCurrentSemester);

router.put(
  '/course-registration',
  checkJwt,
  updateSemesterCoursesValidator(),
  validate,
  registerForCourse
);

// todo: create test for this route
router.post(
  '/process-admission',
  checkJwt,
  checkRole(['staff', 'admin']),
  processAdmissionValidator(),
  validate,
  processAdmission
);

export default router;
