import nodemailer from 'nodemailer';
import { logger } from '../services';
import envConfig from './envConfig';

interface EmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export const sendEMail = async ({ from, to, subject, html }: EmailOptions): Promise<void> => {
    const transporter = nodemailer.createTransport({
        host: envConfig.EMAIL_HOST,
        port: envConfig.EMAIL_PORT,
        secure: true,
        auth: {
            user: envConfig.USER_EMAIL,
            pass: envConfig.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    const mailOptions = {
        from,
        to,
        subject,
        html
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info('Email sent', info.response);
    } catch (error) {
        logger.error(error);
    }
};