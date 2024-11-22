import { Router } from 'express';

import {
  createStaff,
  deleteStaff,
  getStaffById,
  getStaffs,
  updateStaffRecord
} from '../controllers';
import {
  blogImageUploader,
  checkJwt,
  checkRole,
  createStaffValidationRules,
  updateStaffValidationRules,
  uploadBlogImage,
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
  uploadBlogImage, blogImageUploader, // re-using blog Image middleware to upload profilePicture
  updateStaffValidationRules(),
  validate,
  updateStaffRecord
);


router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteStaff);

export default router;
