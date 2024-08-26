import { Router } from 'express';
import { checkJwt, checkRole } from '../middleware';
import { deleteChats, getAllChats, sendChat, getOneLiveChat, getOneUserChatHistory, allChatUsers, deleteChatters } from '../controllers';


const router = Router();

router.post('/create', checkJwt, sendChat);

router.get('/:id',  getOneLiveChat);

router.get('/chat-user/:userId', getOneUserChatHistory);

router.post('/getchatters', allChatUsers);
router.delete('/user/:userId', deleteChatters);

router.get('/', checkJwt, checkRole(['staff', 'admin']), getAllChats);

router.delete('/delete/:id', checkJwt, deleteChats);

export default router;
