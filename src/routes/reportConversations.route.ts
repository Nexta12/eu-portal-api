import { Router } from 'express';
import { checkJwt} from '../middleware';
import { replyAReport, readAReportReply, updateAReply, getAllConversations, deleteAReply } from '../controllers';


const router = Router();

//create a report.
router.post('/reply/:reportId', checkJwt, replyAReport);

// View a Report
 router.get('/reply/:replyId', checkJwt, readAReportReply);

 // Update a report
 router.put('/edit/:replyId', checkJwt, updateAReply);

 // Get all Conversations on a particular report
 router.get("/:reportId", checkJwt, getAllConversations)

 // Delete a Report
 router.delete('/delete/:replyId', checkJwt, deleteAReply);



export default router;
