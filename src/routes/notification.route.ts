import { Router } from 'express';
import { checkJwt, checkRole, noticeValRules, validate } from '../middleware';
import { createNotification, getAllNotifications, getOneNotification, deleteNotification, editNotification } from '../controllers/notification.controller';

const router = Router();

router.post("/create", checkJwt, checkRole(['admin', 'staff']), noticeValRules(), validate, createNotification)

router.get('/:id', checkJwt, getOneNotification);

router.get('/', checkJwt, getAllNotifications);

router.put('/edit/:id', checkJwt, checkRole(['staff', 'admin']), noticeValRules(),
    validate, editNotification);

router.delete('/delete/:id', checkJwt, checkRole(['admin', 'staff']), deleteNotification);

export default router;
