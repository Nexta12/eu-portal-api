import { Router } from 'express';
import { checkJwt } from '../middleware';
import { deleteChatThread, getAllChatConversations, replyChat, getOne } from '../controllers';


const router = Router();

//create a report.
router.post('/reply/:chatId', checkJwt, replyChat);

// Get all Conversations on a particular report
router.get("/:chatId", checkJwt, getAllChatConversations)
router.get("/one/:chatId", checkJwt, getOne)

// Delete a Report
router.delete('/delete/:chatId', checkJwt, deleteChatThread);



export default router;
