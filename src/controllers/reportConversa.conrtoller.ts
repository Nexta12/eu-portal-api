import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository, transformAuthor } from '../utils';
import { ReportingEntity, ReportMessages, StaffEntity, SupportTicketStatus, StudentEntity } from '../entities';

export const replyAReport = async (req: IExtendedRequest, res: Response) => {
    const reportRepository = handleGetRepository(ReportingEntity);
    const reportMessageRepository = handleGetRepository(ReportMessages);
    const studentRepository = handleGetRepository(StudentEntity);
    const staffRepository = handleGetRepository(StaffEntity);

    const { userId, role } = req.jwtPayload;
    const { reportId } = req.params;

    try {
        const { message } = req.body;

        if (!message || message === "") {
            return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: 'Reply Message is required' });
        }

        const report = await reportRepository.findOne({ where: { id: reportId }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Report not found' });
        }

        // Determine if the user is authorized and find the corresponding entity
        let student = null;
        let admin = null;

        if (role === 'student' && userId === report.student.userId) {
            student = await studentRepository.findOne({ where: { userId } });
        } else if (role === 'admin') {
            admin = await staffRepository.findOne({ where: { userId } });
        } else {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'You are not authorized' });
        }

        if (!student && !admin) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'No User Found' });
        }

        const newReply = reportMessageRepository.create({
            message,
            report,
            student,
            admin,
        });

        // Update the report as unread
        report.isRead = false;
        if (role === 'admin') {
            report.isReadByStudent = false
        }
        // Save the updated report
        await reportRepository.save(report);
        await reportMessageRepository.save(newReply);

        // Update the report status based on who replied
        const newStatus = student ? SupportTicketStatus.AWAITING_ADMIN_REPLY : SupportTicketStatus.AWAITING_STUDENT_REPLY;
        await reportRepository.update({ id: reportId }, { status: newStatus });

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newReply.id,
                message: newReply.message,
                reportId: newReply.report.id,
                createdAt: newReply.createdAt
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const readAReportReply = async (req: IExtendedRequest, res: Response) => {
    const reportMessageRepository = handleGetRepository(ReportMessages);

    const { replyId } = req.params;

    try {
        const reply = await reportMessageRepository.findOne({
            where: { id: replyId },
            relations: ['admin', 'student']
        });
        if (!reply) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        const screenedReply = reply.student
            ? {
                ...reply,
                student: transformAuthor(reply.student)
            }
            : {
                ...reply,
                admin: transformAuthor(reply.admin)
            };
        return res.status(HTTP_STATUS.OK.code).send({ data: screenedReply });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const updateAReply = async (req: IExtendedRequest, res: Response) => {
    const reportMessageRepository = handleGetRepository(ReportMessages);

    const { replyId } = req.params;
    const { userId } = req.jwtPayload;
    const { message } = req.body

    try {
        const reply = await reportMessageRepository.findOne({
            where: { id: replyId },
            relations: ['admin', 'student']
        });

        if (!reply) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (reply.student === null) {
            if (userId !== reply.admin.userId)
                return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });

        } else if (userId !== reply.student.userId)
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        await reportMessageRepository.update({ id: replyId }, { message })
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllConversations = async (req: IExtendedRequest, res: Response) => {
    const reportMessageRepository = handleGetRepository(ReportMessages);
    const reportRepository = handleGetRepository(ReportingEntity);

    const { reportId } = req.params;
    const { userId, role } = req.jwtPayload;

    try {
        const report = await reportRepository.findOne({ where: { id: reportId }, relations: ['student'] });

        if (!report) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (userId !== report.student.userId && role !== "admin") {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        }

        const reportMessgs = await reportMessageRepository.find({
            where: { report: { id: reportId } },
            relations: ['admin', 'student'], // Include related entities
            order: { createdAt: 'ASC' }
        });

        const cleanedReports = reportMessgs.map(rep => {
            const stundentReport = rep.student;
            return stundentReport ? { ...rep, student: transformAuthor(rep.student) } : { ...rep, admin: transformAuthor(rep.admin) }
        })
        return res.status(HTTP_STATUS.OK.code).send({ data: cleanedReports });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};


export const deleteAReply = async (req: IExtendedRequest, res: Response) => {
    const reportMessageRepository = handleGetRepository(ReportMessages);

    const { replyId } = req.params
    const { userId } = req.jwtPayload;

    try {


        const reply = await reportMessageRepository.findOne({ where: { id: replyId }, relations: ['student', 'admin'] });

        if (!reply) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (reply.student === null) {
            if (userId !== reply.admin.userId)
                return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });

        } else if (userId !== reply.student.userId)
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });

        await reportMessageRepository.delete({ id: replyId })
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
