
import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository, transformAuthor } from '../utils';
import { EventEntity, StaffEntity } from '../entities';



export const createEvent = async (req: IExtendedRequest, res: Response) => {
    const { title, description, focus, eventDate } = req.body;
    const { userId } = req.jwtPayload
    const eventRepository = handleGetRepository(EventEntity)
    const staffRepository = handleGetRepository(StaffEntity)

    try {

        const staff = await staffRepository.findOne({ where: { userId } });

        if (!staff) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Staff Should Send Broadcast' });
        }

        // Create the new blog with the author
        const newEvent = eventRepository.create({ title, description, focus, eventDate, author: staff });

        // Save the new blog post
        await eventRepository.save(newEvent);

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newEvent.id,
                title: newEvent.title,
                content: newEvent.description,
                eventDate,
                focus: newEvent.focus
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllEvents = async (req: IExtendedRequest, res: Response) => {
    const eventRepository = handleGetRepository(EventEntity);

    const pageSize = Number.parseInt(req.query.pageSize as string, 10) || 10;
    const page = Number.parseInt(req.query.page as string, 10) || 1;

    try {


        const queryBuilder = eventRepository.createQueryBuilder('event')
            .leftJoinAndSelect('event.author', 'author')
            // .where('event.eventDate > :now', { now: new Date() })
            .take(pageSize)
            .skip((page - 1) * pageSize);


        const events = await queryBuilder.getMany();

        const extractedAuthors = events.map(event => ({
            ...event,
            author: transformAuthor(event.author)
        }));

        return res.status(HTTP_STATUS.OK.code).send(extractedAuthors);

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getOneEvent = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;

    try {
        const eventRepository = handleGetRepository(EventEntity);

        const event = await eventRepository.findOne({ where: { id }, relations: ['author'] });
        if (!event) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        const transformedEvent = {
            ...event,
            author: transformAuthor(event.author)
        };


        return res.status(HTTP_STATUS.OK.code).send({ data: transformedEvent });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const editEvent = async (req: IExtendedRequest, res: Response) => {

    const { id } = req.params;
    const eventRepository = handleGetRepository(EventEntity);
    const { userId, role } = req.jwtPayload;
    const { title, description, eventDate, focus } = req.body;


    try {
        const event = await eventRepository.findOne({ where: { id }, relations: ['author'] });

        if (!event) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Event does not exist' });
        }

        if (userId !== event.author.userId || role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'Your are not authorized' });
        }

        await eventRepository.update({ id }, { title, description, eventDate, focus });

        return res.status(HTTP_STATUS.OK.code).send({
            message: HTTP_STATUS.OK.message,
            data: {
                id,
                title,
                description,
                eventDate,
                focus
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteEvent = async (req: IExtendedRequest, res: Response) => {

    const { id } = req.params;
    const eventRepository = handleGetRepository(EventEntity);
    const { userId, role } = req.jwtPayload;

    try {

        const event = await eventRepository.findOne({ where: { id }, relations: ['author'] });

        if (!event) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Event does not exist' });
        }

        if (userId !== event.author.userId || role !== "admin") {
            return res.status(HTTP_STATUS.FORBIDDEN.code).send({ message: 'Your are not authorized' });
        }


        await eventRepository.delete({ id });
        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

