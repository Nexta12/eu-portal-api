import { body } from 'express-validator';

export const updateSemesterCoursesValidator = () => [
  body('academicSessionId', 'academicSessionId is required').notEmpty(),
  body('courses', 'courses must be an array').isArray({ min: 1 }),
  body('courses.*.semesterCourseId', 'courses must have semesterCourseId').notEmpty(),
  body('courses.*.isEnrolled', 'courses must have isEnrolled').isBoolean(),
  body('courses.*.isCompleted', 'courses must have isCompleted').isBoolean(),
  body('courses.*.isPaid', 'courses must have isPaid').isBoolean(),
  body('courses.*.costUsd', 'courses must have costUsd').isNumeric(),
  body('courses.*.code', 'courses must have code').isString().notEmpty()
];

export const processAdmissionValidator = () => [
  body('studentId', 'studentId is required').notEmpty(),
  body('status', 'status should be approved, rejected or pending')
    .isIn(['approved', 'rejected', 'pending'])
    .notEmpty(),
  body('comment', 'comment is required').notEmpty()
];
