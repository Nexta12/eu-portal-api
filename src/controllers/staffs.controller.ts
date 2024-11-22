import { Request, Response } from 'express';

import bcrypt from 'bcryptjs';
import { FindOptionsSelect, Not } from 'typeorm';

import { sendEMail } from '../config/nodemailerClient';
import { StaffEntity } from '../entities';
import { logger } from '../services';
import { generateAdminRegisterEmailTemplate } from '../templates/emailTemplates';
import { EMAIL_FROM, HTTP_STATUS, handleGetRepository } from '../utils';

const columnsToFetch = [
  'userId',
  'firstName',
  'lastName',
  'email',
  'gender',
  'phoneNumber',
  'address',
  'dateOfEmployment',
  'cityOfResidence',
  'designation',
  'role',
  'isPasswordGenerated',
  'createdAt',
  'updatedAt'
];

export const getStaffs = async (_: Request, res: Response) => {
  try {
    const staffRepository = handleGetRepository(StaffEntity);
    const staffs = await staffRepository.find({
      select: columnsToFetch as FindOptionsSelect<StaffEntity>,
      where: {
        email: Not('ernestez12@gmail.com')
      }
    });
    return res.status(HTTP_STATUS.OK.code).send(staffs);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const staffRepository = handleGetRepository(StaffEntity);
    const staff = await staffRepository.findOne({
      where: { userId: id },
      // select: columnsToFetch as FindOptionsSelect<StaffEntity>
    });
    if (!staff) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message, data: staff });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    gender,
    phoneNumber,
    address,
    dateOfEmployment,
    cityOfResidence,
    designation
  } = req.body;
  let hashedPassword: string;
  try {
    const staffRepository = handleGetRepository(StaffEntity);
    const staff = await staffRepository.findOneBy({ email });
    if (staff) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ errors: { message: 'Email already exists' } });
    }

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newStaff = staffRepository.create({
      firstName,
      lastName,
      email,
      password: password && hashedPassword,
      role,
      gender,
      phoneNumber,
      address,
      dateOfEmployment,
      cityOfResidence,
      designation,
      isPasswordGenerated: true
    });

    const results = await staffRepository.save(newStaff);

    // todo: send email to staff with password
    await sendEMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Action Required: eUniversity Africa login details',
      html: generateAdminRegisterEmailTemplate(firstName, password)
    });

    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        userId: results.userId,
        firstName: results.firstName,
        lastName: results.lastName,
        email: results.email
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const updateStaffRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    role,
    gender,
    phoneNumber,
    address,
    cityOfResidence,
    designation,
    middleName,
    description,
    quote,
    contributions,
    location,
    portfolio,
    department,
    qualification,
    certifications,
    blogImage 
  } = req.body;

  try {
    const staffRepository = handleGetRepository(StaffEntity);
    const currentStaff = await staffRepository.findOneBy({ userId: id });
    if (!currentStaff) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    await staffRepository.update(id, {
      firstName,
      lastName,
      role,
      gender,
      phoneNumber,
      address,
      cityOfResidence,
      designation,
      middleName,
      description,
      quote,
      contributions,
      location,
      portfolio,
      department,
      qualification,
      certifications,
      profilePicture: blogImage
    });

    const updatedStaff = await staffRepository.findOneBy({ userId: id });
    return res.status(HTTP_STATUS.OK.code).send({
      message: HTTP_STATUS.OK.message,
      data: {
        userId: updatedStaff.userId,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        email: updatedStaff.email
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const staffRepository = handleGetRepository(StaffEntity);
    const staff = await staffRepository.findOneBy({ userId: id });
    if (!staff) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    await staffRepository.delete(staff.userId);
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
