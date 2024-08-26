import { Request, Response } from 'express';

import { FacultyEntity, ProgrammeEntity } from '../entities';
import { logger } from '../services';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, handleGetRepository } from '../utils';

export const getAllFaculties = async (_: Request, res: Response) => {
  try {
    const facultyRepository = handleGetRepository(FacultyEntity);
    const faculties = await facultyRepository.find();
    return res.status(HTTP_STATUS.OK.code).send(faculties);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getFacultyById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const facultyRepository = handleGetRepository(FacultyEntity);
    const faculty = await facultyRepository.findOneBy({ id });
    if (!faculty) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message, data: faculty });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const createFaculty = async (req: IExtendedRequest, res: Response) => {
  const { name } = req.body;
  const { userId } = req.jwtPayload;

  try {
    const facultyRepository = handleGetRepository(FacultyEntity);
    const faculty = await facultyRepository.findOneBy({ name });
    if (faculty) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ message: 'Faculty with given name already exist' });
    }

    const newFaculty = facultyRepository.create({ name, createdBy: { userId } });
    await facultyRepository.save(newFaculty);
    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        id: newFaculty.id,
        name: newFaculty.name
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const facultyRepository = handleGetRepository(FacultyEntity);

  try {
    const faculty = await facultyRepository.findOneBy({ id });
    if (!faculty) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }

    await facultyRepository.update({ id }, { name });
    return res.status(HTTP_STATUS.OK.code).send({
      message: 'Faculty updated successfully',
      data: {
        id,
        name
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteFaculty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const programmeRepository = handleGetRepository(ProgrammeEntity);
  const facultyRepository = handleGetRepository(FacultyEntity);

  try {
    const programmes = await programmeRepository.findBy({ faculty: { id } });
    if (programmes.length > 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'Cannot delete faculty with programmes' });
    }

    const faculty = await facultyRepository.findOneBy({ id });
    if (!faculty) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }

    await facultyRepository.delete({ id });

    return res.status(HTTP_STATUS.OK.code).send({ message: 'Faculty deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
