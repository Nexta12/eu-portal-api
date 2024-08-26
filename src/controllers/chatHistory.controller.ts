import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository } from '../utils';
import { LiveChatEntity } from '../entities';
import { ChatUserEntity } from '../entities/ChatUsersEntity';

export const sendChat = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);
    const chatUserRepository = handleGetRepository(ChatUserEntity);

    const { message } = req.body;
    const { userId } = req.jwtPayload;

    if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST.code).send({
            message: 'User ID is required'
        });
    }

    try {
        // Retrieve the current chat user
        const currentChatUser = await chatUserRepository.findOne({ where: { userId } });

        if (!currentChatUser) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({
                message: 'Chat user not found'
            });
        }

        // Create the new chat entry
        const newChat = liveChatRepository.create({
            message,
            chatUser: currentChatUser
        });
        // Save the new chat entry
        await liveChatRepository.save(newChat);

        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newChat.id,
                message: newChat.message,
                chatUser: {
                    userId: currentChatUser.userId,
                }
            }
        });

    } catch (error) {
        logger.error('Error sending chat:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({
            message: 'An error occurred while sending the chat'
        });
    }
};


export const getOneUserChatHistory = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);

    const { userId } = req.params;

    try {

        const liveChat = await liveChatRepository.findOne({ where: { chatUser: { userId } }, relations: ['chatUser'] });

        if (!liveChat) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        return res.status(HTTP_STATUS.OK.code).send({ data: liveChat });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const getOneLiveChat = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);

    const { id } = req.params;

    try {

        const liveChat = await liveChatRepository.findOne({ where: { id }, relations: ['chatUser'] });
        if (!liveChat) {
            return res
                .status(HTTP_STATUS.NOT_FOUND.code)
                .send({ message: HTTP_STATUS.NOT_FOUND.message });
        }

        return res.status(HTTP_STATUS.OK.code).send({ data: liveChat });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const allChatUsers = async (req: IExtendedRequest, res: Response) => {
    const chatUsersRepository = handleGetRepository(ChatUserEntity);

    try {

        const allUsers = await chatUsersRepository.find();

        return res.status(HTTP_STATUS.OK.code).send({ data: allUsers });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllChats = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);

    try {

        const chats = await liveChatRepository.find({ relations: ['chatUser'] },);

        return res.status(HTTP_STATUS.OK.code).send({ data: chats });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const deleteChats = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);
    const { id } = req.params
    const { role } = req.jwtPayload;

    try {

        // Only the Student should edit his report.

        const chat = await liveChatRepository.findOne({ where: { id } });

        if (!chat) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Ticket Not found' });
        }

        if (role !== 'admin') {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'Not authorized' });
        }

        await liveChatRepository.delete({ id });

        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const deleteChatters = async (req: IExtendedRequest, res: Response) => {
    const chatUsersRepository = handleGetRepository(ChatUserEntity);
    const { userId } = req.params


    try {

        // Only the Student should edit his report.

        const user = await chatUsersRepository.findOne({ where: { userId } });

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'User Not FOund' });
        }

        await chatUsersRepository.delete({ userId });

        return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
