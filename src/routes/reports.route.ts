import { Router } from 'express';
import { checkJwt, checkRole, createReportValRule, validate } from '../middleware';
import { createReport, readAReport, updateAReport, viewAllReports, deleteAReport, getOneStudentAllReports, closeReport } from '../controllers';

const router = Router();

//create a report.
router.post('/create', checkJwt,  createReportValRule(), validate, createReport);
router.put('/:id', checkJwt, closeReport);

// View a Report
router.get('/:id', checkJwt, readAReport);

router.get('/student/:studentId', checkJwt, getOneStudentAllReports);

// Update a report
router.put('/edit/:id', checkJwt, createReportValRule(), validate, updateAReport);

// See All Reports
router.get('/', checkJwt, checkRole(['staff', 'admin']), viewAllReports);

// Delete a Report

router.delete('/delete/:id', checkJwt, deleteAReport);




export default router;
