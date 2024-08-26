/* eslint-disable @typescript-eslint/naming-convention */
import { Response } from 'express';

import axios from 'axios';

import envConfig from '../config/envConfig';
import {
  AdmissionStatus,
  BillEntity,
  BillType,
  Currency,
  PaymentChannel,
  PaymentEntity,
  PaymentStatus,
  SemesterCourseEntity,
  StudentEntity
} from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import {
  DOLLAR_TO_NAIRA,
  HTTP_STATUS,
  PAYSTACK_BASE_URL,
  generateReferenceNumber,
  handleGetRepository
} from '../utils';

type PaystackPaymentInitialization = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackPaymentVerification = Pick<PaystackPaymentInitialization, 'status' | 'message'> & {
  data: {
    status: string;
    paid_at: string;
  };
};

const paystackHeaders = { headers: { Authorization: `Bearer ${envConfig.PAYSTACK_SECRET_KEY}` } };
export const PAYMENT_CALLBACK_URL = `${envConfig.CLIENT_BASE_URL}/dashboard/confirm-payment`;



const getStudentWalletBalance = async (userId: string) => {
  const paymentRepository = handleGetRepository(PaymentEntity);
  const billRepository = handleGetRepository(BillEntity);
  try {
    const payments = await paymentRepository.find({
      where: {
        student: { userId },
        status: PaymentStatus.SUCCESS
      },
      order: { paidAt: 'DESC' }
    });

    const bills = await billRepository.findBy({ student: { userId }, isPaid: true });
    const totalPayments = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalBills = bills.reduce((acc, curr) => acc + curr.amountUsd, 0) * DOLLAR_TO_NAIRA;
    const balance = totalPayments - totalBills;
    return {
      balance,
      currency: Currency.NGN,
      lastDeposit: payments[0]
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const initializePayment = async (req: IExtendedRequest, res: Response) => {
  const { amount, description } = req.body;
  const { userId, email } = req.jwtPayload;
  const amountInKobo = amount * 100;
  const paymentRepository = handleGetRepository(PaymentEntity);

  try {
    const paystackResponse = await axios.post<PaystackPaymentInitialization>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        amount: amountInKobo,
        email,
        callback_url: PAYMENT_CALLBACK_URL
      },
      paystackHeaders
    );

    const { authorization_url, access_code, reference } = paystackResponse.data.data;
    const newPayment = paymentRepository.create({
      reference,
      amount,
      accessCode: access_code,
      description,
      student: { userId },
      status: PaymentStatus.PENDING,
      currency: Currency.NGN,
      channel: PaymentChannel.PAYSTACK
    });
    await paymentRepository.save(newPayment);

    return res.status(HTTP_STATUS.OK.code).send({
      message: 'Payment initialized successfully',
      data: { url: authorization_url, amount, reference }
    });
  } catch (error) {
    const isAxiosError = axios.isAxiosError(error);
    logger.error(isAxiosError ? error.response.data : error);
    if (isAxiosError) {
      return res
        .status(HTTP_STATUS.BAD_GATEWAY.code)
        .send({ message: 'Payment could not be initialized. Please try again later' });
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const verifyPayment = async (req: IExtendedRequest, res: Response) => {
  const { reference } = req.params;
  const { userId, admissionStatus } = req.jwtPayload;
  const paymentRepository = handleGetRepository(PaymentEntity);
  const studentRepository = handleGetRepository(StudentEntity);
  const billRepository = handleGetRepository(BillEntity);
  try {
    const paystackResponse = await axios.get<PaystackPaymentVerification>(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      paystackHeaders
    );
    const { status, paid_at } = paystackResponse.data.data;

    const payment = await paymentRepository.findOneBy({ reference });

    if (!payment) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Payment not found' });
    }

    const paymentStatus =
      status === 'success'
        ? PaymentStatus.SUCCESS
        : status === 'failed'
        ? PaymentStatus.FAILED
        : PaymentStatus.PENDING;

    const paidAt = status === 'success' ? new Date(paid_at) : null;

    await paymentRepository.update({ reference }, { status: paymentStatus, paidAt });

    if (admissionStatus === AdmissionStatus.APPLICATION) {
      await studentRepository.update(
        { userId },
        { admissionStatus: AdmissionStatus.APPLICATION_FEE_PAID }
      );

      await billRepository.update(
        { student: { userId }, type: BillType.APPLICATION_FEE },
        { isPaid: true, paidAt, referenceNumber: reference }
      );
    }

    if (paymentStatus !== PaymentStatus.SUCCESS) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ success: false, message: 'Payment was not successful', paidAt });
    }

    return res
      .status(HTTP_STATUS.OK.code)
      .send({ success: true, message: 'Payment verified successfully', paidAt });
  } catch (error) {
    const isAxiosError = axios.isAxiosError(error);
    logger.error(isAxiosError ? error.response.data : error);
    if (isAxiosError) {
      return res
        .status(HTTP_STATUS.BAD_GATEWAY.code)
        .send({ message: 'Payment could not be verified. Please try again later' });
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const getStudentBalance = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  try {
    const balance = await getStudentWalletBalance(userId);
    res.status(HTTP_STATUS.OK.code).send(balance);
  } catch (error) {
    logger.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const payBill = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const { billId } = req.body;
  const billRepository = handleGetRepository(BillEntity);
  const semesterCourseRepository = handleGetRepository(SemesterCourseEntity);
  try {
    const bill = await billRepository.findOne({
      where: { id: billId, student: { userId } },
      relations: ['semesterCourse']
    });
    const amountNgn = bill.amountUsd * DOLLAR_TO_NAIRA;

    if (!bill) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Bill not found' });
    }

    if (bill.isPaid) {
      return res.status(HTTP_STATUS.BAD_REQUEST.code).send({ message: 'Bill has been paid' });
    }

    const balance = await getStudentWalletBalance(userId);
    const hasEnoughBalance = balance.balance >= amountNgn;

    if (!hasEnoughBalance) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'Student does not have enough balance to pay bill' });
    }

    if (bill.type === BillType.COURSE_REGISTRATION) {
      const semesterCourse = await semesterCourseRepository.findOneBy({
        id: bill.semesterCourse.id
      });

      if (!semesterCourse) {
        return res
          .status(HTTP_STATUS.NOT_FOUND.code)
          .send({ message: 'Semester course not found' });
      }

      await semesterCourseRepository.update({ id: semesterCourse.id }, { isPaid: true });
    }

    const referenceNumber = generateReferenceNumber();
    await billRepository.update(
      { id: billId },
      { isPaid: true, paidAt: new Date(), referenceNumber }
    );

    return res.status(HTTP_STATUS.OK.code).send({ message: 'Bill paid successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const getAccountStatement = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const paymentRepository = handleGetRepository(PaymentEntity);
  const billRepository = handleGetRepository(BillEntity);
  try {
    const payments = await paymentRepository.findBy({
      student: { userId },
      status: PaymentStatus.SUCCESS
    });

    const bills = await billRepository.findBy({
      student: { userId },
      isPaid: true
    });

    const formattedPayments = payments.map((payment) => ({
      date: payment.paidAt,
      referenceNumber: payment.reference,
      description: payment.description,
      type: 'credit',
      amount: payment.amount
    }));

    const formattedBills = bills.map((bill) => ({
      date: bill.paidAt,
      referenceNumber: bill.referenceNumber,
      description: bill.description,
      type: 'debit',
      amount: bill.amountUsd * DOLLAR_TO_NAIRA
    }));

    const transactions = [...formattedPayments, ...formattedBills];
    const sortedTransactions = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const transactionsWithBalance = sortedTransactions.map((transaction) => {
      const { type, amount } = transaction;
      if (type === 'credit') {
        balance += amount;
      } else if (type === 'debit') {
        balance -= amount;
      }
      return { ...transaction, balance };
    });
    return res.status(HTTP_STATUS.OK.code).send(transactionsWithBalance.reverse());
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};
