import { Router } from 'express';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse
} from '../controllers';
import {
  checkJwt,
  checkRole,
  createCourseValidationRules,
  getCoursesValidationRules,
  updateCourseValidationRules,
  validate
} from '../middleware';

const router = Router();

router.get('/', checkJwt, getCoursesValidationRules(), validate, getAllCourses);

router.get('/:id', checkJwt, getCourseById);

router.post(
  '/create',
  checkJwt,
  checkRole(['staff', 'admin']),
  createCourseValidationRules(),
  validate,
  createCourse
);

router.put(
  '/update/:id',
  checkJwt,
  checkRole(['staff', 'admin']),
  updateCourseValidationRules(),
  validate,
  updateCourse
);

router.delete('/delete/:id', checkJwt, checkRole(['staff', 'admin']), deleteCourse);

export default router;
