import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { EMAIL_FROM, HTTP_STATUS, getSnippet, handleGetRepository } from '../utils';
import { ContactEntity } from '../entities/ContactEntity';
import { sendEMail } from '../config/nodemailerClient';
import { generateContactFormReplyTemplate } from '../templates/emailTemplates';


export const createContctMessage = async (req: IExtendedRequest, res: Response) => {
    const contactRepository = handleGetRepository(ContactEntity);

    const { firstName, lastName, email, message } = req.body


    try {

        const snippet = getSnippet(message, 10)

        const newContactMessage = contactRepository.create({ firstName, lastName, email, snippet, message });
        await contactRepository.save(newContactMessage);

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newContactMessage.id,
                firstName: newContactMessage.firstName,
                lastName: newContactMessage.lastName,
                email: newContactMessage.email,
                message: newContactMessage.message,
            }
        });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getOneContactMessage = async (req: IExtendedRequest, res: Response) => {
    const contactRepository = handleGetRepository(ContactEntity);

    const { id } = req.params

    try {

        const contactMessage = await contactRepository.findOne({ where: { id } });

        if (!contactMessage) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        // Update the message as read
        contactMessage.isRead = true;

        // Save the updated message
        await contactRepository.save(contactMessage);

        return res.status(HTTP_STATUS.OK.code).send({ data: contactMessage });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const replyContactMessage = async (req: IExtendedRequest, res: Response) => {
    const contactRepository = handleGetRepository(ContactEntity);

    const { firstName, lastName, email, message } = req.body
    const { id } = req.params
    try {

        const contactMessage = await contactRepository.findOne({ where: { id } });

        if (!contactMessage) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }
        await contactRepository.update({ id }, { reply: message });
        // Send Email
        await sendEMail({
            from: EMAIL_FROM,
            to: email,
            subject: 'Reply From eUniversity Africa ',
            html: generateContactFormReplyTemplate(firstName, lastName, message)
        })
        return res.status(HTTP_STATUS.OK.code).send({ data: contactMessage });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};


export const getAllContactMessages = async (req: IExtendedRequest, res: Response) => {
    const contactRepository = handleGetRepository(ContactEntity);

    try {

        const contactMessages = await contactRepository.find({
            order: { createdAt: 'DESC' }

        });

        return res.status(HTTP_STATUS.OK.code).send(contactMessages);

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteContactMessage = async (req: IExtendedRequest, res: Response) => {
    const contactRepository = handleGetRepository(ContactEntity);

    const { id } = req.params
    const { role } = req.jwtPayload;

    try {

        const contactMessage = await contactRepository.findOne({ where: { id } });

        if (!contactMessage) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        if (role !== 'admin') {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: HTTP_STATUS.UNAUTHORIZED.message });
        }

        await contactRepository.delete({ id });

        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
