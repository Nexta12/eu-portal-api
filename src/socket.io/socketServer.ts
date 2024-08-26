import { Server as SocketIOServer } from 'socket.io';
import http from 'node:http';
import { handleGetRepository } from '../utils';
import { LiveChatEntity, ReportingEntity } from '../entities';
import { logger } from '../services';
import { ContactEntity } from '../entities/ContactEntity';

const FRONTEND_URL = process.env.CLIENT_BASE_URL

export const initializeSocketServer = (server: http.Server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });
    let users = [];

    const addUser = (userId: string, socketId: string) => {
        if (!users.some((user) => user.userId === userId)) {
            users.push({ userId, socketId });
        }
        io.emit('getOnlineUsers', users);
    };

    const removeUser = (socketId: string) => {
        users = users.filter(user => user.socketId !== socketId);
        io.emit('getOnlineUsers', users); // Emit updated users list
    };

    io.on('connection', (socket) => {
        logger.info('A user connected');

        socket.on('addUser', (userId) => {
            addUser(userId, socket.id);
        });

        socket.on('sendChatterMessage', ({ chatMessage, chatHistory, senderId }) => {
            io.emit('getChatterMessage', { chatMessage, chatHistory, senderId });
        });

        socket.on('sendAdminMessage', (data) => {
            io.emit('getAdminMessage', data);
        });

        socket.on('sendChatterIsTyping', (data) => {
            io.emit('chatterIsTyping', data);
        });

        socket.on('sendAdminIsTyping', (data) => {
            io.emit('adminIsTyping', data);
        });

        socket.on('getUnreadChats', async () => {
            const liveChatRepository = handleGetRepository(LiveChatEntity);
            try {
                const chats = await liveChatRepository.find({
                    where: { isRead: false },
                });
                const totalCount = chats.length;
                io.emit('totalUnreadChats', totalCount); // Use socket.emit instead of io.emit
            } catch (error) {
                logger.error(error);
            }
        });

        socket.on('getUnreadTickets', async () => {
            const reportRepository = handleGetRepository(ReportingEntity);
            try {

                const reports = await reportRepository.find({
                    where: { isRead: false },
                    order: { createdAt: 'DESC' },
                    relations: ['student']
                });

                const totalCount = reports.length;
                io.emit('totalUnreadTickets', totalCount);

            } catch (error) {
                logger.error(error);
            }
        });

        socket.on('getUnreadMessages', async () => {
            const contactRepository = handleGetRepository(ContactEntity);
            try {

                const contactMessages = await contactRepository.find({
                    where: { isRead: false },

                });

                const totalCount = contactMessages.length;
                io.emit('totalUnreadMessages', totalCount);

            } catch (error) {
                logger.error(error);
            }
        });

        interface StudentUserId {
            userId: string;
        }
        socket.on('getStudentUnreadTickets', async (data: StudentUserId) => {
            const reportRepository = handleGetRepository(ReportingEntity);
            try {
                const reports = await reportRepository.find({
                    where: {
                        isReadByStudent: false,
                        student: { userId: data.userId }
                    },
                    order: { createdAt: 'DESC' },
                    relations: ['student'],
                });

                const totalCount = reports.length;
                io.emit('totalStudentUnreadTickets', totalCount);
            } catch (error) {
                logger.error('Error fetching unread tickets:', error);
            }
        });
        interface TicketId {
            id: string;
        }
        socket.on('markStudentTicketAsRead', async (data: TicketId) => {
            const reportRepository = handleGetRepository(ReportingEntity);
            try {
                await reportRepository.update({ id: data.id }, { isReadByStudent: true });
                io.emit('totalStudentUnreadTickets');
            } catch (error) {
                logger.error(error);
            }
        });

        socket.on('chatIsOpened', async (data) => {
            try {
                const liveChatRepository = handleGetRepository(LiveChatEntity);
                await liveChatRepository.update({ id: data.chatHistory }, { isRead: true });
                const chats = await liveChatRepository.find({
                    where: { isRead: false },
                });
                const totalCount = chats.length;
                io.emit('messageRead');
                io.emit('totalUnreadChats', totalCount);
            } catch (error) {
                logger.error(error);
            }
        });

        socket.on('disconnect', () => {
            logger.info('User disconnected');
            removeUser(socket.id);
        });
    });

    return io;
};

