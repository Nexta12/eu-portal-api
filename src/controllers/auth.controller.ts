import { Request, Response } from 'express';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import crypto from 'node:crypto';

import { JWT_KEY } from '../config/data';
import { ChatMessageEntity, LiveChatEntity, ResetPasswordTokenEntity, StaffEntity, StudentEntity, UserRole } from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { BCRYPT_SALT_ROUNDS, EMAIL_FROM, HTTP_STATUS, handleGetRepository } from '../utils';
import { ChatUserEntity } from '../entities/ChatUsersEntity';
import { sendEMail } from '../config/nodemailerClient';
import { generateForgotPasswordEmailTemplate } from '../templates/emailTemplates';

const createNewChatUser = async (repo: any, email: string, name: string) => {
  const newUser = repo.create({
    email,
    name,
    role: UserRole.CHAT
  });
  const savedUser = await repo.save(newUser);
  return {
    userId: savedUser.userId,
    email: savedUser.email,
    name: savedUser.name,
    role: UserRole.CHAT
  };
};
const handleExistingUserChat = async (liveChatRepo: any, chatMessagesRepo: any, message: string, user: any) => {
  const chatHistory = await liveChatRepo.findOne({
    where: {
      chatUser: {
        userId: user.userId
      }
    }
  });

  if (!chatHistory) {
    throw new Error('Chat history not found');
  }

  const newMessage = chatMessagesRepo.create({
    message,
    chatId: chatHistory.id,
    chat_user: user,
    staff: null
  });
  await chatMessagesRepo.save(newMessage);
};

const createChatEntry = async (repo: any, message: string, userPayload: any) => {
  const chatEntry = repo.create({
    message,
    chatUser: {
      userId: userPayload.userId
    }
  });
  await repo.save(chatEntry);
};


export const chatBoxSignUp = async (req: Request, res: Response): Promise<Response> => {
  const { name, welcomeMessage, email } = req.body;
  const trimmedEmail = email.trim().toLowerCase();

  const chatUserRepository = handleGetRepository(ChatUserEntity);
  const liveChatRepository = handleGetRepository(LiveChatEntity);
  const chatMessagesRepository = handleGetRepository(ChatMessageEntity);

  try {
    const existingUser = await chatUserRepository.findOne({ where: { email: trimmedEmail } });
    const userPayload = existingUser ? {
      userId: existingUser.userId,
      email: existingUser.email,
      name: existingUser.name,
      role: UserRole.CHAT
    } : await createNewChatUser(chatUserRepository, trimmedEmail, name);

    const token = jwt.sign(userPayload, JWT_KEY, { expiresIn: '1h' });

    await (existingUser ? handleExistingUserChat(liveChatRepository, chatMessagesRepository, welcomeMessage, existingUser) : createChatEntry(liveChatRepository, welcomeMessage, userPayload));

    return res.status(HTTP_STATUS.OK.code).json({
      message: 'Joined Chat, Please wait for next available admin',
      token,
      data: userPayload
    });

  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
      message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message
    });
  }
};


export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const invalidLoginCredentials = 'Invalid login credentials';
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const staffRepository = handleGetRepository(StaffEntity);

    const student = await studentRepository.findOneBy({ email });
    const staff = await staffRepository.findOneBy({ email });

    if (!student && !staff) {
      return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: invalidLoginCredentials });
    }

    const user = student || staff;
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (!isSamePassword)
      return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: invalidLoginCredentials });

    const payload = {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      ...(user.role === UserRole.STUDENT && {
        admissionStatus: (user as StudentEntity).admissionStatus
      })
    };


    const token = jwt.sign(payload, JWT_KEY, { expiresIn: '12h' });

    return res.status(HTTP_STATUS.OK.code).send({
      message: 'Login successfully',
      token,
      data: payload
    });

  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const handleChangePassword = async (req: IExtendedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const { userId } = req.jwtPayload;
  const studentRepository = handleGetRepository(StudentEntity);

  try {
    const user = await studentRepository.findOneBy({ userId });
    const isSamePassword = await bcrypt.compare(currentPassword, user.password);
    if (!isSamePassword) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await studentRepository.update(userId, {
      password: hashedPassword,
      isPasswordGenerated: false
    });
    return res.status(HTTP_STATUS.OK.code).send({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const checkForDuplicateEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  const duplicateEmailMessage = 'Email already exists';
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const staffRepository = handleGetRepository(StaffEntity);

    const student = await studentRepository.findOneBy({ email });
    if (student) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ errors: { email: duplicateEmailMessage } });
    }
    const staff = await staffRepository.findOneBy({ email });
    if (staff) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ errors: { email: duplicateEmailMessage } });
    }
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const validateAuthentication = async (req: IExtendedRequest, res: Response) => {
  try {
    return res
      .status(HTTP_STATUS.OK.code)
      .send({ message: 'Authentication successful', data: req.jwtPayload });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const studentRepository = handleGetRepository(StudentEntity);
  const passwordResetTokenRepository = handleGetRepository(ResetPasswordTokenEntity);
  try {
    const student = await studentRepository.findOneBy({ email });
    if (!student) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'User with this email does not exist' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = passwordResetTokenRepository.create({
      token: resetToken,
      createdAt: new Date(),
      userId: student
    });
    await passwordResetTokenRepository.save(passwordResetToken);
    await sendEMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Action Required: eUniversity Africa login details',
      html: generateForgotPasswordEmailTemplate(resetToken, student.userId)
})
    return res
      .status(HTTP_STATUS.OK.code)
      .send({ message: 'Password reset initiated. Please check your email' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, userId, newPassword } = req.body;
  const studentRepository = handleGetRepository(StudentEntity);
  const passwordResetTokenRepository = handleGetRepository(ResetPasswordTokenEntity);

  try {
    const student = await studentRepository.findOneBy({ userId });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'This user does not exist' });
    }

    const passwordResetToken = await passwordResetTokenRepository.findOneBy({ token, userId });

    if (!passwordResetToken) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'Password reset token is invalid' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await studentRepository.update(userId, {
      password: hashedPassword,
      isPasswordGenerated: false
    });
    await passwordResetTokenRepository.delete(passwordResetToken.id);
    return res.status(HTTP_STATUS.OK.code).send({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
