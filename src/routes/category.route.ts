import { Router } from 'express';

import { createCategory, deleteCategory, getAllCategories, getOneCategory, updateCategory } from '../controllers';
import { checkJwt, checkRole, createCategoryValRules, validate } from '../middleware';

const router = Router();

router.get('/', getAllCategories);

router.get('/:id', getOneCategory);

router.post('/create', checkJwt, checkRole(['staff', 'admin']), createCategoryValRules(), validate, createCategory);

router.put('/update/:id', checkJwt, checkRole(['admin', 'staff']), createCategoryValRules(), validate, updateCategory);

router.delete('/delete/:id', checkJwt, checkRole(['admin']), deleteCategory);

export default router;
