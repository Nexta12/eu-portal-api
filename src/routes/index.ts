import { Router } from 'express';

import { healthCheckController } from '../controllers';
import academics from './academics.route';
import auth from './auth.route';
import courses from './courses.route';
import faculties from './faculties.route';
import payment from './payment.route';
import programmes from './programmes.route';
import staffs from './staffs.route';
import students from './students.route';
import welcome from './welcome.route';
import blogs from './blogs.route'
import categories from './category.route'
import events from './events.route'
import notifications from './notification.route'
import reports from './reports.route'
import reportConversations from './reportConversations.route'
import liveChatHistory from './liveChatHistory'
import chatmessages from './liveConversations.route'
import contact from './contact.route'



const router = Router();

router.use('/', welcome);
router.use('/students', students);
router.use('/staffs', staffs);
router.use('/auth', auth);
router.use('/faculties', faculties);
router.use('/programmes', programmes);
router.use('/courses', courses);
router.use('/payment', payment);
router.use('/academics', academics);
router.use('/blogs', blogs)
router.use('/categories', categories)
router.use('/events', events)
router.use('/notifications', notifications)
router.use('/reports', reports)
router.use('/reportsMsgs', reportConversations)
router.use('/chats', liveChatHistory)
router.use('/chatmessages', chatmessages)
router.use('/contacts', contact)


router.get('/healthcheck', healthCheckController);

export default router;
