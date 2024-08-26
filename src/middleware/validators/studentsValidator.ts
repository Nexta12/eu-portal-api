import { body, query } from 'express-validator';

import { MINIMUM_PASSWORD_LENGTH } from '../../utils';

export const getStudentsValidationRules = () => [
  query(
    'admissionStatus',
    'admissionStatus should be application, application_fee_paid, in_review, admitted or rejected'
  )
    .optional()
    .isIn(['application', 'application_fee_paid', 'in_review', 'admitted', 'rejected'])
];

export const studentValidationRules = () => [
  body('firstName')
    .exists()
    .withMessage('firstName is required')
    .isString()
    .withMessage('firstName must be a string'),
  body('lastName')
    .exists()
    .withMessage('lastName is required')
    .isString()
    .withMessage('lastName must be a string'),
  body('email', 'This must be a proper email address').isEmail(),
  body('password')
    .optional()
    .isLength({ min: MINIMUM_PASSWORD_LENGTH })
    .withMessage(`Password must have a minimum length of ${MINIMUM_PASSWORD_LENGTH}`),
  body('country', 'country is required').isString().notEmpty(),
  body('phoneNumber', 'phoneNumber is required').isString().notEmpty(),
  body('cohort', 'cohort must be certificate, diploma, degree or postgraduate').isIn([
    'certificate',
    'diploma',
    'degree',
    'postgraduate'
  ]),
  body('employmentStatus', 'employmentStatus must be employed, unemployed or self-employed')
    .optional()
    .isIn(['employed', 'unemployed', 'self-employed']),
  body('gender', 'gender should be male or female').isIn(['male', 'female']),
  body('cohort', 'cohort should be certificate, diploma, degree or postgraduate').isIn([
    'certificate',
    'diploma',
    'degree',
    'postgraduate'
  ]),
  body('programme', 'programme is required').notEmpty()
];

export const deletePictureValidationRules = () => [
  body('pictureUrl', 'pictureUrl is required').isString().notEmpty()
];

export const deleteFileValidationRules = () => [
  body('fileUrl', 'fileUrl is required').isString().notEmpty()
];

export const uploadPictureValidationRules = () => [
  body('picture').custom((_, { req }) => {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error('Only JPEG, JPG, and PNG files are allowed');
    }
    return true;
  })
];

export const uploadFileValidationRules = () => [
  body('file').custom((_, { req }) => {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error('Only JPEG, JPG, PNG and PDF files are allowed');
    }
    return true;
  })
];

export const updateStudentValidationRules = () => [
  body('employmentStatus', 'employmentStatus must be employed, unemployed or self-employed')
    .optional()
    .isIn(['employed', 'unemployed', 'self-employed'])
];

export const updateStudentPasswordValidationRules = () => [
  query('isPaid', 'isPaid should be a boolean').optional().isBoolean()
];
