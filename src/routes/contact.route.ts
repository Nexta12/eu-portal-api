import { Router } from 'express';
import { checkJwt, checkRole, createContactRule, validate } from '../middleware';
import { createContctMessage, getOneContactMessage, getAllContactMessages, replyContactMessage, deleteContactMessage } from '../controllers';

const router = Router();

router.post('/create', createContactRule(), validate, createContctMessage);
router.get('/:id', getOneContactMessage);
router.get('/', getAllContactMessages);
router.put('/reply/:id', createContactRule(), validate, replyContactMessage);
router.delete('/delete/:id', checkJwt, checkRole(['staff', 'admin']), deleteContactMessage);


export default router;
