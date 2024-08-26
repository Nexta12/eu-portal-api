/* eslint-disable sonarjs/no-duplicate-string */
import { Request, Response } from 'express';

import {
  Cohort,
  CourseEntity,
  FacultyEntity,
  Level,
  ProgrammeEntity,
  Semester,
  StudentEntity
} from '../entities';
import { logger } from '../services';
import { HTTP_STATUS, handleGetRepository } from '../utils';

const getCoursesOrderedByLevelAndSemester = async (
  programmeId: string
): Promise<CourseEntity[]> => {
  const courseRepository = handleGetRepository(CourseEntity);

  return courseRepository.query(
    `
    SELECT *
    FROM courses
    WHERE "programmeId" = $1
    ORDER BY CASE
       WHEN "level" = $2 THEN 1
       WHEN "level" = $3 THEN 2
       WHEN "level" = $4 THEN 3
       WHEN "level" = $5 THEN 4
       WHEN "level" = $6 THEN 5
       ELSE 6
       END,
     CASE
       WHEN "semester" = $7 THEN 1
       WHEN "semester" = $8 THEN 2
       ELSE 3
       END
  `,
    [
      programmeId,
      Level.ONE_HUNDRED_LEVEL,
      Level.TWO_HUNDRED_LEVEL,
      Level.THREE_HUNDRED_LEVEL,
      Level.FOUR_HUNDRED_LEVEL,
      Level.FIVE_HUNDRED_LEVEL,
      Semester.FIRST,
      Semester.SECOND
    ]
  );
};

export const getAllProgrammes = async (req: Request, res: Response) => {
  const { withFaculty } = req.query;
  try {
    const programmeRepository = handleGetRepository(ProgrammeEntity);
    const programmes = await programmeRepository.find({
      order: { name: 'ASC' },
      ...(withFaculty === 'true' && { relations: ['faculty'] })
    });
    return res.status(HTTP_STATUS.OK.code).send(programmes);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getProgrammeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const programmeRepository = handleGetRepository(ProgrammeEntity);
    const programme = await programmeRepository.findOne({ where: { id }, relations: ['faculty'] });
    if (!programme) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'Programme with given id not found' });
    }
    return res.status(HTTP_STATUS.OK.code).send(programme);
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const getProgrammeCourses = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cohort } = req.query;
  const programmeRepository = handleGetRepository(ProgrammeEntity);

  const cohortMap = {
    certificate: Cohort.CERTIFICATE,
    degree: Cohort.DEGREE,
    diploma: Cohort.DIPLOMA,
    postgraduate: Cohort.POSTGRADUATE
  };

  try {
    const programme = await programmeRepository.findOneBy({ id });
    if (!programme) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'Programme with given id not found' });
    }

    let courses = await getCoursesOrderedByLevelAndSemester(id);
    if (cohort) {
      courses = courses.filter((course) => course.cohort === cohortMap[cohort as string]);
    }

    return res.status(HTTP_STATUS.OK.code).send({ ...programme, courses });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const createProgramme = async (req: Request, res: Response) => {
  const {
    name,
    code,
    description,
    durationInMonths,
    isCertificate,
    isDiploma,
    isDegree,
    isPostgraduate,
    entryRequirements,
    objectives,
    faculty: facultyId,
    overview
  } = req.body;

  try {
    const programmeRepository = handleGetRepository(ProgrammeEntity);
    const facultyRepository = handleGetRepository(FacultyEntity);
    const programme = await programmeRepository.findOneBy({ name });
    if (programme) {
      return res
        .status(HTTP_STATUS.CONFLICT.code)
        .send({ message: 'Programme with given name already exists' });
    }

    const faculty = await facultyRepository.findOneBy({ id: facultyId });
    if (!faculty) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'Faculty with given id does not exist' });
    }

    const newProgramme = programmeRepository.create({
      name,
      code,
      description,
      durationInMonths,
      isCertificate,
      isDiploma,
      isDegree,
      isPostgraduate,
      entryRequirements,
      objectives,
      faculty: facultyId,
      overview
    });
    await programmeRepository.save(newProgramme);
    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        id: newProgramme.id,
        name: newProgramme.name,
        code: newProgramme.code,
        description: newProgramme.description,
        durationInMonths: newProgramme.durationInMonths,
        isCertificate: newProgramme.isCertificate,
        isDiploma: newProgramme.isDiploma,
        isDegree: newProgramme.isDegree
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const updateProgramme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    code,
    description,
    durationInMonths,
    isCertificate,
    isDiploma,
    isDegree,
    isPostgraduate,
    entryRequirements,
    objectives,
    overview
  } = req.body;
  const programmeRepository = handleGetRepository(ProgrammeEntity);

  try {
    const programme = await programmeRepository.findOneBy({ id });
    if (!programme) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'Programme with given id not found' });
    }

    await programmeRepository.update(id, {
      name,
      code,
      description,
      durationInMonths,
      isCertificate,
      isDiploma,
      isDegree,
      isPostgraduate,
      entryRequirements,
      objectives,
      overview
    });

    return res.status(HTTP_STATUS.OK.code).send({
      message: HTTP_STATUS.OK.message,
      data: {
        id,
        name,
        code
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};

export const deleteProgramme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const programmeRepository = handleGetRepository(ProgrammeEntity);
  const courseRepository = handleGetRepository(CourseEntity);
  const studentRepository = handleGetRepository(StudentEntity);

  try {
    const programme = await programmeRepository.findOneBy({ id });
    if (!programme) {
      return res
        .status(HTTP_STATUS.NOT_FOUND.code)
        .send({ message: 'Programme with given id not found' });
    }

    const courses = await courseRepository.findBy({ programme: { id } });
    if (courses.length > 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'You can not delete a programme that has courses' });
    }

    const students = await studentRepository.findBy({ programme: { id } });
    if (students.length > 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST.code)
        .send({ message: 'You can not delete a programme that has students' });
    }

    await programmeRepository.delete({ id });
    return res.status(HTTP_STATUS.OK.code).send({ message: 'Programme deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).send({ message: error.message });
  }
};
