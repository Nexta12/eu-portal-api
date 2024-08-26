import { Router } from 'express';
import { checkJwt, checkRole, createEventValRule, validate } from '../middleware';
import { createEvent, deleteEvent, editEvent, getAllEvents, getOneEvent } from '../controllers';

const router = Router();


router.post('/create', checkJwt, checkRole(['staff', 'admin']), createEventValRule(), validate, createEvent);

router.get('/:id', getOneEvent); 
router.get('/', getAllEvents);

router.put('/edit/:id', checkJwt, checkRole(['staff', 'admin']), createEventValRule(),
    validate, editEvent);

router.delete('/delete/:id', checkJwt, checkRole(['staff', 'admin']), deleteEvent);


export default router;
