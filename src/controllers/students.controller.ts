import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { FindOptionsSelect } from 'typeorm';
import cloudinaryClient from '../config/cloudinaryClient';
import {
  AdmissionStatus,
  BillEntity,
  BillType,
  DocumentEntity,
  ProgrammeEntity,
  StudentEntity,
  UserRole
} from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import {
  BCRYPT_SALT_ROUNDS,
  EMAIL_FROM,
  HTTP_STATUS,
  extractPublicIdFromUrl,
  handleGetRepository
} from '../utils';
import { sendEMail } from '../config/nodemailerClient';
import { generateApplicationEmailTemplate } from '../templates/emailTemplates';

const columnsToFetch = [
  'userId',
  'firstName',
  'middleName',
  'lastName',
  'email',
  'role',
  'country',
  'nationality',
  'matriculationNumber',
  'address',
  'cohort',
  'gender',
  'phoneNumber',
  'dateOfBirth',
  'city',
  'zipCode',
  'employmentStatus',
  'admissionStatus',
  'isPasswordGenerated',
  'createdAt'
];

const APPLICATION_FEE = 20;

export const getStudents = async (req: Request, res: Response) => {
  const { admissionStatus } = req.query;
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const users = await studentRepository.find({
      select: columnsToFetch as FindOptionsSelect<StudentEntity>,
      where: admissionStatus && { admissionStatus: admissionStatus as AdmissionStatus }
    });
    return res.status(HTTP_STATUS.OK.code).send(users);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    password,
    country,
    phoneNumber,
    dateOfBirth,
    city,
    zipCode,
    cohort,
    employmentStatus,
    programme,
    address,
    nationality
  } = req.body;

  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const programmeRepository = handleGetRepository(ProgrammeEntity);
    const billRepository = handleGetRepository(BillEntity);

    const currentStudent = await studentRepository.findOneBy({ email });
    if (currentStudent) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ errors: { email: 'Email already exists' } });
    }

    // const userPassword = password || `${firstName.toLowerCase()}pass123`;
    const userPassword = 'student123';
    const hashedPassword = await bcrypt.hash(userPassword, BCRYPT_SALT_ROUNDS);


    // Check if programme exists
    const currentProgramme = await programmeRepository.findOneBy({ id: programme });
    if (!currentProgramme) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ errors: { programme: 'Programme not found' } });
    }

    if (!password) {
      await sendEMail({
        from: EMAIL_FROM,
        to: email,
        subject: 'Action Required: eUniversity Africa login details',
        html: generateApplicationEmailTemplate(firstName, userPassword)
      });
    }

    const student = studentRepository.create({
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRole.STUDENT,
      country,
      phoneNumber,
      dateOfBirth,
      city,
      zipCode,
      cohort,
      employmentStatus,
      address,
      nationality,
      isPasswordGenerated: !password,
      admissionStatus: AdmissionStatus.APPLICATION,
      programme: { id: programme }
    });
    const result = await studentRepository.save(student);

    const applicationFee = billRepository.create({
      type: BillType.APPLICATION_FEE,
      amountUsd: APPLICATION_FEE,
      description: 'Application fee',
      student: { userId: result.userId }
    });
    await billRepository.save(applicationFee);

    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        userId: result.userId,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const student = await studentRepository.findOne({
      where: { userId: id },
      select: columnsToFetch as FindOptionsSelect<StudentEntity>,
      relations: ['programme', 'document']
    });
    if (!student) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message, data: student });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const updateStudentRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    firstName,
    middleName,
    lastName,
    country,
    phoneNumber,
    dateOfBirth,
    city,
    zipCode,
    address,
    employmentStatus,
    nationality
  } = req.body;
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const student = await studentRepository.findOneBy({ userId: id });
    if (!student) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    await studentRepository.update(student.userId, {
      firstName,
      lastName,
      country,
      phoneNumber,
      dateOfBirth,
      city,
      zipCode,
      employmentStatus,
      address,
      middleName,
      nationality
    });

    const updatedStudent = await studentRepository.findOne({
      where: { userId: id },
      select: columnsToFetch as FindOptionsSelect<StudentEntity>
    });

    return res.status(HTTP_STATUS.OK.code).send({
      message: HTTP_STATUS.OK.message,
      data: updatedStudent
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const studentRepository = handleGetRepository(StudentEntity);
    const student = await studentRepository.findOneBy({ userId: id });
    if (!student) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    await studentRepository.delete(student.userId);
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const handleUploadStudentPicture = async (req: IExtendedRequest, res: Response) => {
  const documentRepository = handleGetRepository(DocumentEntity);
  const { userId } = req.jwtPayload;
  try {
    const pictureUrl = req.uploadedFile.secure_url;

    // check if student has uploaded a picture before if yes, delete the previous picture from cloudinary
    const student = await documentRepository.findOneBy({ student: { userId } });
    if (student?.picture) {
      const publicId = extractPublicIdFromUrl(student.picture, 'picture');
      await cloudinaryClient.uploader.destroy(publicId);
    }

    // upsert creates a new record if it doesn't exist and updates if it does
    await documentRepository.upsert(
      {
        picture: pictureUrl,
        student: { userId }
      },
      { conflictPaths: ['student'] }
    );

    res.send({
      message: 'picture uploaded successfully',
      data: {
        pictureUrl
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteStudentPicture = async (req: IExtendedRequest, res: Response) => {
  const { pictureUrl } = req.body;
  const { userId } = req.jwtPayload;
  const documentRepository = handleGetRepository(DocumentEntity);

  try {
    const publicId = extractPublicIdFromUrl(pictureUrl, 'picture');
    await cloudinaryClient.uploader.destroy(publicId);

    await documentRepository.update({ student: { userId } }, { picture: null });
    return res.status(HTTP_STATUS.OK.code).send({ message: 'Image deleted' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const handleUploadStudentFile = async (req: IExtendedRequest, res: Response) => {
  const documentRepository = handleGetRepository(DocumentEntity);
  const { userId } = req.jwtPayload;
  try {
    const newFile = {
      format: req.uploadedFile.format,
      createdAt: req.uploadedFile.created_at,
      bytes: req.uploadedFile.bytes,
      url: req.uploadedFile.secure_url
    };
    const student = await documentRepository.findOneBy({ student: { userId } });

    const docsList = student && student.docs?.length > 0 ? [...student.docs, newFile] : [newFile];

    await documentRepository.upsert(
      {
        docs: docsList,
        student: { userId }
      },
      { conflictPaths: ['student'] }
    );

    res.send({
      message: 'file uploaded successfully',
      data: newFile
    });
  } catch (error) {
    logger.error(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteStudentFile = async (req: IExtendedRequest, res: Response) => {
  const documentRepository = handleGetRepository(DocumentEntity);
  const { fileUrl } = req.body;
  const { userId } = req.jwtPayload;
  try {
    const studentDocument = await documentRepository.findOneBy({ student: { userId } });
    if (studentDocument.docs?.includes(fileUrl)) {
      const publicId = extractPublicIdFromUrl(fileUrl, 'file');
      await cloudinaryClient.uploader.destroy(publicId);

      const docs = studentDocument.docs.filter((doc) => doc !== fileUrl);
      await documentRepository.update({ student: { userId } }, { docs });
      return res.status(HTTP_STATUS.OK.code).send({ message: 'File deleted' });
    }

    return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'File not found' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getStudentDocuments = async (req: IExtendedRequest, res: Response) => {
  const documentRepository = handleGetRepository(DocumentEntity);
  const { userId } = req.jwtPayload;
  try {
    const studentDocument = await documentRepository.findOneBy({ student: { userId } });
    return res.status(HTTP_STATUS.OK.code).send({
      message: HTTP_STATUS.OK.message,
      data: studentDocument
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const submitApplication = async (req: IExtendedRequest, res: Response) => {
  const studentRepository = handleGetRepository(StudentEntity);
  const { userId } = req.jwtPayload;
  try {
    const student = await studentRepository.findOneBy({ userId });
    if (!student) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    await studentRepository.update({ userId }, { admissionStatus: AdmissionStatus.IN_REVIEW });
    return res.status(HTTP_STATUS.OK.code).send({ message: 'Application submitted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getStudentBills = async (req: IExtendedRequest, res: Response) => {
  const billRepository = handleGetRepository(BillEntity);
  const { userId } = req.jwtPayload;
  const { isPaid } = req.query;
  try {
    const bills = await billRepository.findBy({
      student: { userId },
      ...(isPaid && { isPaid: isPaid === 'true' })
    });
    return res.status(HTTP_STATUS.OK.code).send(bills);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
