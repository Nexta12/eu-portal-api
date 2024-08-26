import { Router } from 'express';
import { createBlog, deleteBlog, editBlog, getAllBlogs, getOneBlog } from "../controllers/blogs.controller"

import { blogImageUploader, checkJwt, checkRole, createblogValRule, uploadBlogImage, validate } from '../middleware';

const router = Router();


router.post('/create', checkJwt, checkRole(['staff', 'admin']), uploadBlogImage, blogImageUploader, createblogValRule(), validate, createBlog);

router.get('/:slug', getOneBlog);
router.get('/', getAllBlogs);

router.put('/edit/:slug', checkJwt, checkRole(['staff', 'admin']), uploadBlogImage, blogImageUploader, createblogValRule(),
    validate, editBlog);

router.delete('/delete/:id', checkJwt, checkRole(['staff', 'admin']), deleteBlog);


export default router;
