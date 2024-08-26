import { Router } from 'express';

import {
  createStudent,
  deleteStudentById,
  deleteStudentFile,
  deleteStudentPicture,
  getStudentBills,
  getStudentById,
  getStudentDocuments,
  getStudents,
  handleUploadStudentFile,
  handleUploadStudentPicture,
  submitApplication,
  updateStudentRecord
} from '../controllers';
import {
  checkJwt,
  checkRole,
  deleteFileValidationRules,
  deletePictureValidationRules,
  getStudentsValidationRules,
  processAndUploadFile,
  processAndUploadImage,
  studentValidationRules,
  updateStudentPasswordValidationRules,
  updateStudentValidationRules,
  uploadFile,
  uploadFileValidationRules,
  uploadImage,
  uploadPictureValidationRules,
  validate
} from '../middleware';

const router = Router();

router.get('/', getStudentsValidationRules(), validate, checkJwt, getStudents);

router.get('/bills', checkJwt, updateStudentPasswordValidationRules(), validate, getStudentBills);

// todo: extract to student/:id
router.get('/:id', checkJwt, getStudentById);

router.post('/create', studentValidationRules(), validate, createStudent);

router.put('/update/:id', checkJwt, updateStudentValidationRules(), validate, updateStudentRecord);

router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteStudentById);

router.post(
  '/upload-picture',
  checkJwt,
  uploadImage,
  uploadPictureValidationRules(),
  validate,
  processAndUploadImage,
  handleUploadStudentPicture
);

router.put(
  '/remove-picture',
  checkJwt,
  deletePictureValidationRules(),
  validate,
  deleteStudentPicture
);

router.post(
  '/upload-file',
  checkJwt,
  uploadFile,
  uploadFileValidationRules(),
  validate,
  processAndUploadFile,
  handleUploadStudentFile
);

router.put('/remove-file', checkJwt, deleteFileValidationRules(), validate, deleteStudentFile);

router.get('/:id/documents', checkJwt, getStudentDocuments);

router.put('/submit-application', checkJwt, submitApplication);

export default router;
