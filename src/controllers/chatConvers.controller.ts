import { Response } from 'express';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository, transformAuthor } from '../utils';
import { ChatMessageEntity, ChatUserEntity, LiveChatEntity, ReportMessages, StaffEntity, } from '../entities';


export const replyChat = async (req: IExtendedRequest, res: Response) => {
    const liveChatRepository = handleGetRepository(LiveChatEntity);
    const chatMessagesRepository = handleGetRepository(ChatMessageEntity);
    const chatUserRepository = handleGetRepository(ChatUserEntity);
    const staffRepository = handleGetRepository(StaffEntity);

    const { userId, role } = req.jwtPayload;
    const { chatId } = req.params;

    try {
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: 'Reply Message is required' });
        }

        const chat = await liveChatRepository.findOne({ where: { id: chatId }, relations: ['chatUser'] });

        if (!chat) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'No chat found' });
        }

        // Determine if the user is authorized and find the corresponding entity
        let ChattingVisitor = null;
        let admin = null;
  
        if (role === 'chat' && userId === chat.chatUser.userId) {
            ChattingVisitor = await chatUserRepository.findOne({ where: { userId } });
            if (!ChattingVisitor) {
                return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Chat user not found' });
            }
        } else if (role === 'admin') {
            admin = await staffRepository.findOne({ where: { userId } });
            if (!admin) {
                return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Admin not found' });
            }
        } else {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'You are not authorized' });
        }

        const newReply = chatMessagesRepository.create({
            message,
            chatId: chat.id,
            chatuser: ChattingVisitor,
            staff: admin || null
        });

        // Update the chat as unread
        if(role !== 'admin'){
            chat.isRead = false;
            await liveChatRepository.save(chat);
        }
        await chatMessagesRepository.save(newReply);
        return res.status(HTTP_STATUS.CREATED.code).send({
            message: HTTP_STATUS.CREATED.message,
            data: {
                id: newReply.id,
                message: newReply.message,
                createdAt: newReply.createdAt
            }
        });

    } catch (error) {
        logger.error('Error in replyChat:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
export const getOne = async (req: IExtendedRequest, res: Response) => {

    const chatMessagesRepository = handleGetRepository(ChatMessageEntity);
   

    const { chatId } = req.params;
   
    try {

        const chatMessg = await chatMessagesRepository.findOne({
            where: { id: chatId },
            relations: ['staff', 'chat_user'], // Include related entities
            order: { createdAt: 'ASC' }
        });

        return res.status(HTTP_STATUS.OK.code).send({ data: chatMessg });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};

export const getAllChatConversations = async (req: IExtendedRequest, res: Response) => {

    const chatMessagesRepository = handleGetRepository(ChatMessageEntity);
    const liveChatRepository = handleGetRepository(LiveChatEntity);

    const { chatId } = req.params;
    const { userId, role } = req.jwtPayload;

    try {
        const chat = await liveChatRepository.findOne({ where: { id: chatId }, relations: ['chatUser'] });

        if (!chat) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Nothing found' });
        }

        if (userId !== chat.chatUser.userId && role !== "admin") {
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'You are not authorized' });
        }

        const chatMessages = await chatMessagesRepository.find({
            where: { chatId: chat.id },
            relations: ['staff', 'chatuser'], // Include related entities
            order: { createdAt: 'ASC' }
        });
        // Clean up and transform messages
        const cleanedChats = chatMessages.map(message => ({
            ...message,
            staff: message.staff ? transformAuthor(message.staff) : null
        }));
        // Update the chat as unread
        return res.status(HTTP_STATUS.OK.code).send({ data: cleanedChats });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};


export const deleteChatThread = async (req: IExtendedRequest, res: Response) => {
    const reportMessageRepository = handleGetRepository(ReportMessages);

    const { replyId } = req.params
    const { userId } = req.jwtPayload;

    try {


        const reply = await reportMessageRepository.findOne({ where: { id: replyId }, relations: ['student', 'admin'] });

        if (!reply) {
            return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Reply Not found' });
        }

        if (!reply.student && userId !== reply.student.userId) return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'Not authorized' });
        if (userId !== reply.admin.userId)
            return res.status(HTTP_STATUS.UNAUTHORIZED.code).send({ message: 'Not authorized' });

        await reportMessageRepository.delete({ id: replyId })
        return res.status(HTTP_STATUS.OK.code).send({ msg: "Successfully Deleted" });

    } catch (error) {
        logger.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
    }
};
