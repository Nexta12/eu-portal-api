import { Response } from 'express';
import { NotificationEntity, StaffEntity, } from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository, transformAuthor } from '../utils';

export const createNotification = async (req: IExtendedRequest, res: Response) => {
    const { title, message, level } = req.body;
    const { userId } = req.jwtPayload;

    const notificationRepository = handleGetRepository(NotificationEntity);
    const staffRepository = handleGetRepository(StaffEntity)

    try {
        const staff = await staffRepository.findOne({ where: { userId } });

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Staff Should Send Broadcast' });
        }
       
        const newNotification = notificationRepository.create({ title, message, level, author: staff })

        await notificationRepository.save(newNotification)
        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newNotification.id,
                title: newNotification.title,
                content: newNotification.message,
                level: newNotification.level,
                author: userId
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getOneNotification = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const notificationRepository = handleGetRepository(NotificationEntity);

        const notification = await notificationRepository.findOne({ where: { id }, relations: ['author'] });

        if (!notification) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        const transformedNotification = {
            ...notification,
            author: transformAuthor(notification.author)
        };

        return res.status(HTTP_STATUS.OK.code).send({data: transformedNotification});

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllNotifications = async (req: IExtendedRequest, res: Response) => {
    const notificationRepository = handleGetRepository(NotificationEntity);

    try {
      
        const notifications = await notificationRepository.find({order: { createdAt: 'DESC' }, relations: ['author']});

        const extractedAuthors = notifications.map(notification => ({
            ...notification,
            author: transformAuthor(notification.author)
        }));

        return res.status(HTTP_STATUS.OK.code).send(extractedAuthors);

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const editNotification = async (req: IExtendedRequest, res: Response) => {

    const notificationRepository = handleGetRepository(NotificationEntity);
    const { id } = req.params;
    const { title, message, level } = req.body;
    const { userId, role } = req.jwtPayload;

    try {

        const notification = await notificationRepository.findOne({ where: { id }, relations: ['author'] });

        if (!notification) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Notification does not exist' });
        }

        if (userId !== notification.author.userId && role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'Your are not authorized' });
        }

        await notificationRepository.update({ id }, { title, message, level});

        return res.status(HTTP_STATUS.OK.code).send({
            message: HTTP_STATUS.OK.message,
            data: {
                id,
                title,
                message,
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteNotification = async (req: IExtendedRequest, res: Response) => {

    const { id } = req.params;
    const notificationRepository = handleGetRepository(NotificationEntity);
    const { userId, role } = req.jwtPayload;

    try {
        const notification = await notificationRepository.findOne({ where: { id }, relations: ['author'] });

        if (!notification) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (userId !== notification.author.userId && role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'Your are not authorized' });
        }

        await notificationRepository.delete({ id });
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
