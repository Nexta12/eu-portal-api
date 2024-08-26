import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, generateFiveDigitNumber, getSnippet, handleGetRepository, transformAuthor } from '../utils';
import { AdmissionStatus, ReportingEntity, SupportTicketStatus , StudentEntity } from '../entities';


export const createReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);
    const studentRepository = handleGetRepository(StudentEntity);

    const { subject, message } = req.body
    const { userId } = req.jwtPayload;

    try {

        const student = await studentRepository.findOne({ where: { userId, admissionStatus: AdmissionStatus.ADMITTED } });

        // Fetch the staff entity by userId
        if (!student) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Student not found' });
        }

        // Generate Ticket Id
        const ticketNo = generateFiveDigitNumber()

        const snippet = getSnippet(message, 7)

        // Create the new blog with the author
        const newReport = reportRepository.create({ subject, message, student, ticketNo, snippet });

        // Save the new blog post
        await reportRepository.save(newReport);

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newReport.id,
                subject: newReport.subject,
                message: newReport.message,
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const readAReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);

    const { id } = req.params
   
    try {

        // Staff, Admin or the Student that created the report can read a report.

        const report = await reportRepository.findOne({ where: { id }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        // Update the report as read
        report.isRead = true;

        // Save the updated report
        await reportRepository.save(report);

        const screanedReport =
        {
            ...report,
            student: transformAuthor(report.student)
        };

        return res.status(HTTP_STATUS.OK.code).send({ data: screanedReport });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getOneStudentAllReports = async (req: IExtendedRequest, res: Response) => {

    const reportRepository = handleGetRepository(ReportingEntity);

    const { studentId } = req.params;

    try {
        const allReports = await reportRepository.find({
            where: { student: { userId: studentId } },
            relations: ['student'] // Include other relations if necessary
        });

        const extractedallReports = allReports.map(report => ({
            ...report,
            student: transformAuthor(report.student),
            author: transformAuthor(report.student)
        }));

        return res.status(HTTP_STATUS.OK.code).send(extractedallReports);
    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const viewAllReports = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);

    try {

        const reports = await reportRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['student']
        });

        const extractedReports = reports.map(report => ({
            ...report,
            author: transformAuthor(report.student),
            student: transformAuthor(report.student)
        }));

        return res.status(HTTP_STATUS.OK.code).send(extractedReports);

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const updateAReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);

    const { id } = req.params
    const { userId } = req.jwtPayload;
    const { subject, message } = req.body

    try {

        // Only the Student should edit his report.

        const report = await reportRepository.findOne({ where: { id }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (userId !== report.student.userId) {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        }
        let snippet: string;

        if (report.message !== message) {
            snippet = getSnippet(message, 7)
        }

        await reportRepository.update({ id }, { subject, message, snippet });

        return res.status(HTTP_STATUS.OK.code).send({
            message: HTTP_STATUS.OK.message,
            data: {
                id,
                subject,
                message
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const closeReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);

    const { id } = req.params
    const { userId, role } = req.jwtPayload;
    try {

        // Only the Student should edit his report.

        const report = await reportRepository.findOne({ where: { id }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (userId !== report.student.userId && role !== 'admin') {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        }

        await reportRepository.update({ id }, { status: SupportTicketStatus.CLOSED });

        return res.status(HTTP_STATUS.OK.code).send({
            message: 'Support ticket is marked closed',

        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const deleteAReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);

    const { id } = req.params
    const { userId, role } = req.jwtPayload;

    try {

        // Only the Student should edit his report.

        const report = await reportRepository.findOne({ where: { id }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (userId !== report.student.userId && role !== 'admin') {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        }

        await reportRepository.delete({ id });

        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
