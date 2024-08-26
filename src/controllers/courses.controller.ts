import { Request, Response } from 'express';

import { Repository } from 'typeorm';

import { CourseEntity, ProgrammeEntity, SemesterCourseEntity } from '../entities';
import { logger } from '../services';
import { HTTP_STATUS, handleGetRepository } from '../utils';

const getDistinctProgrammeIds = async (
  courseRepository: Repository<CourseEntity>
): Promise<string[]> => {
  const queryBuilder = courseRepository
    .createQueryBuilder('a')
    .select('DISTINCT a.programmeId')
    .groupBy('a.programmeId');

  const result = await queryBuilder.getRawMany();
  return result.map((row) => row.programmeId);
};

export const getAllCourses = async (req: Request, res: Response) => {
  const { group, limit } = req.query;
  const courseRepository = handleGetRepository(CourseEntity);
  const programmeRepository = handleGetRepository(ProgrammeEntity);
  try {
    if (group) {
      const programmeIds = await getDistinctProgrammeIds(courseRepository);
      const programmeMap = programmeIds.map(async (programmeId) => {
        const programmesQueryBuilder = programmeRepository
          .createQueryBuilder('a')
          .innerJoin('faculties', 'b', 'a.facultyId = b.id')
          .select(['a.*', 'b.name as "facultyName"'])
          .where('a.id = :programmeId', { programmeId });
        const programme = await programmesQueryBuilder.getRawOne();
        const courses = await courseRepository.findBy({ programme: { id: programmeId } });
        return { ...programme, courses };
      });
      const groupedProgrammes = await Promise.all(programmeMap);
      return res.status(HTTP_STATUS.OK.code).send(groupedProgrammes);
    }

    const courses = await courseRepository.find({ take: limit && Number(limit) });
    return res.status(HTTP_STATUS.OK.code).send(courses);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const courseRepository = handleGetRepository(CourseEntity);
    const course = await courseRepository.findOne({ where: { id }, relations: ['programme'] });
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }
    return res.status(HTTP_STATUS.OK.code).send(course);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const {
    name,
    code,
    description,
    unit,
    level,
    semester,
    cohort,
    costUsd,
    programme: programmeId,
    isCompulsory
  } = req.body;
  const courseRepository = handleGetRepository(CourseEntity);
  const programmeRepository = handleGetRepository(ProgrammeEntity);

  try {
    const existingCourse = await courseRepository.findOne({ where: [{ name }, { code }] });
    if (existingCourse) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ message: 'Course with given code or name already exists' });
    }

    const programme = await programmeRepository.findOneBy({ id: programmeId });
    if (!programme) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Programme does not exist' });
    }

    const newCourse = courseRepository.create({
      name,
      code,
      description,
      unit,
      level,
      cohort,
      costUsd,
      semester,
      isCompulsory,
      programme: { id: programmeId }
    });

    await courseRepository.save(newCourse);
    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        id: newCourse.id,
        name: newCourse.name,
        code: newCourse.code,
        description: newCourse.description,
        unit: newCourse.unit
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, unit, level, semester, cohort, costUsd, isCompulsory } =
    req.body;
  const courseRepository = handleGetRepository(CourseEntity);

  try {
    const course = await courseRepository.findOneBy({ id });
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({ message: 'Course does not exist' });
    }

    await courseRepository.update(
      { id },
      {
        name,
        code,
        description,
        unit,
        level,
        semester,
        cohort,
        costUsd,
        isCompulsory
      }
    );

    return res.status(HTTP_STATUS.OK.code).send({
      message: HTTP_STATUS.OK.message,
      data: {
        id,
        name,
        code,
        description,
        unit
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const courseRepository = handleGetRepository(CourseEntity);
  const semesterCourseRepository = handleGetRepository(SemesterCourseEntity);
  try {
    const course = await courseRepository.findOneBy({ id });
    if (!course) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: HTTP_STATUS.NOT_FOUND.message });
    }

    const semesterCourse = await semesterCourseRepository.findOneBy({ course: { id } });
    if (semesterCourse) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'Course has been assigned to a semester' });
    }

    await courseRepository.delete({ id });
    return res.status(HTTP_STATUS.OK.code).send({ message: HTTP_STATUS.OK.message });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
