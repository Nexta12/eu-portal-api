import { Response } from 'express';
import {
  AcademicsEntity,
  AcademicsStatus,
  AdmissionStatus,
  BillEntity,
  BillType,
  CourseEntity,
  Level,
  ProcessAdmissionStatus,
  Semester,
  SemesterCourseEntity,
  StudentEntity
} from '../entities';
import { AdmissionEntity } from '../entities/AdmissionEntity';
import { logger } from '../services';
import { generateAdmissionLetterEmailTemplate } from '../templates/emailTemplates';
import { IExtendedRequest } from '../types/JwtPayload';
import { SemesterCourseType } from '../types/general';
import {
  HTTP_STATUS,
  calculateNextSemester,
  generateMatriculationNumber,
  getCurrentAcademicSession,
  handleGetRepository,
  semesterRegistrationPayments
} from '../utils';
import { sendEMail } from '../config/nodemailerClient';


export const registerForSemester = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const academicsRepository = handleGetRepository(AcademicsEntity);
  const billsRepository = handleGetRepository(BillEntity);
  const coursesRepository = handleGetRepository(CourseEntity);
  const studentRepository = handleGetRepository(StudentEntity);
  const semesterCourseRepository = handleGetRepository(SemesterCourseEntity);

  try {
    const academicsRecord = await academicsRepository.findOneBy({
      student: { userId },
      status: AcademicsStatus.IN_PROGRESS
    });

    if (academicsRecord) {
      return res.status(HTTP_STATUS.CONFLICT.code).send({
        message: 'This student is already registered for an active semester'
      });
    }

    // To get the current level and semester of the student, we need to get the last registered semester
    const lastRegisteredSemester = await academicsRepository.findOne({
      where: { student: { userId } },
      order: { createdAt: 'DESC' }
    });

    const currentSemester = lastRegisteredSemester
      ? calculateNextSemester(lastRegisteredSemester.level, lastRegisteredSemester.semester)
      : {
        level: Level.ONE_HUNDRED_LEVEL,
        semester: Semester.FIRST
      };

    // todo: add current session to the academics table and use 2023/2024 as the format
    const academics = academicsRepository.create({
      level: currentSemester.level as Level,
      semester: currentSemester.semester as Semester,
      student: { userId }
    });

    await academicsRepository.save(academics);
    await Promise.all(
      semesterRegistrationPayments.map(async ({ type, description, amountUsd }) => {
        const newPayment = billsRepository.create({
          type,
          description,
          amountUsd,
          student: { userId },
          academicSession: academics
        });
        await billsRepository.save(newPayment);
      })
    );

    const student = await studentRepository.findOneBy({ userId });

    const semesterCourses = await coursesRepository.findBy({
      level: currentSemester.level as Level,
      semester: currentSemester.semester as Semester,
      cohort: student.cohort,
      programme: { id: student.programme?.id }
    });

    const semesterCoursesToSave = semesterCourses.map((semesterCourse) =>
      semesterCourseRepository.create({
        course: { id: semesterCourse.id },
        academicSession: academics
      })
    );

    await Promise.all(
      semesterCoursesToSave.map((semesterCourse) => semesterCourseRepository.save(semesterCourse))
    );

    return res.status(HTTP_STATUS.CREATED.code).send({
      message: HTTP_STATUS.CREATED.message,
      data: {
        id: academics.id,
        level: academics.level,
        semester: academics.semester,
        status: academics.status
      }
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const getCurrentSemester = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const academicsRepository = handleGetRepository(AcademicsEntity);
  const billsRepository = handleGetRepository(BillEntity);
  const coursesRepository = handleGetRepository(CourseEntity);
  const studentRepository = handleGetRepository(StudentEntity);

  try {
    const academicsRecord = await academicsRepository.findOneBy({
      student: { userId },
      status: AcademicsStatus.IN_PROGRESS
    });

    if (!academicsRecord) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({
        message: 'This student has no active semester'
      });
    }

    const student = await studentRepository.findOne({
      where: { userId },
      relations: ['programme']
    });
    const bills = await billsRepository.findBy({ academicSession: { id: academicsRecord.id } });

    const semesterCourses = await coursesRepository
      .createQueryBuilder('a')
      .innerJoin('a.semesterCourses', 'b', 'a.id = b.courseId')
      .where('b.academicSessionId = :id', { id: academicsRecord.id })
      .select([
        'b.id as "semesterCourseId"',
        'a.name as name',
        'a.code as code',
        'a.description as description',
        'a.unit as unit',
        'a.costUsd as "costUsd"',
        'a.isCompulsory as "isCompulsory"',
        'b.isPaid as "isPaid"',
        'b.isEnrolled as "isEnrolled"',
        'b.isCompleted as "isCompleted"'
      ])
      .getRawMany();

    return res.status(HTTP_STATUS.OK.code).send({
      ...academicsRecord,
      cohort: student.cohort,
      programme: student.programme.name,
      bills,
      courses: semesterCourses
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const registerForCourse = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const { academicSessionId, courses } = req.body;
  const semesterCourseRepository = handleGetRepository(SemesterCourseEntity);
  const academicsRepository = handleGetRepository(AcademicsEntity);
  const billRepository = handleGetRepository(BillEntity);

  try {
    const academicsRecord = await academicsRepository.findOneBy({
      id: academicSessionId
    });

    if (!academicsRecord) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({
        message: 'Academic session not found'
      });
    }

    const semesterCoursesToUpdate = courses.map(
      ({ semesterCourseId, isEnrolled, isCompleted, isPaid }: SemesterCourseType) =>
        semesterCourseRepository.update(
          { id: String(semesterCourseId), academicSession: academicSessionId },
          {
            isEnrolled,
            isCompleted,
            isPaid
          }
        )
    );
    await Promise.all(semesterCoursesToUpdate);

    await Promise.all(
      courses.map(async ({ code, costUsd, semesterCourseId }: SemesterCourseType) => {
        const newPayment = billRepository.create({
          type: BillType.COURSE_REGISTRATION,
          description: `Course registration for ${code}`,
          amountUsd: costUsd,
          student: { userId },
          academicSession: { id: academicSessionId },
          semesterCourse: { id: String(semesterCourseId) }
        });
        await billRepository.save(newPayment);
      })
    );

    return res.status(HTTP_STATUS.OK.code).send({
      message: 'Semester courses enrolled successfully'
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};

export const processAdmission = async (req: IExtendedRequest, res: Response) => {
  const { userId } = req.jwtPayload;
  const { status, studentId, comment } = req.body;
  const studentRepository = handleGetRepository(StudentEntity);
  const admissionRepository = handleGetRepository(AdmissionEntity);
  try {
    const student = await studentRepository.findOne({
      where: { userId: studentId },
      relations: ['programme']
    });

    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND.code).send({
        message: 'Student not found'
      });
    }

    if (student.admissionStatus !== AdmissionStatus.IN_REVIEW) {
      return res.status(HTTP_STATUS.CONFLICT.code).send({
        message: 'Student is not eligible for admission'
      });
    }

    let admissionLetter: string | null = null;
    let matriculationNumber: string | null = null;

    if (status === ProcessAdmissionStatus.APPROVED) {
      const session = getCurrentAcademicSession();
      matriculationNumber = generateMatriculationNumber();
      admissionLetter = generateAdmissionLetterEmailTemplate({
        studentName: student.firstName,
        matriculationNumber,
        programme: student.programme.name,
        cohort: student.cohort,
        session
      });
    }

    const admission = admissionRepository.create({
      status,
      comment,
      admissionLetter,
      processedBy: { userId },
      student: { userId: studentId }
    });
    await admissionRepository.save(admission);

    const admissionStatus =
      status === ProcessAdmissionStatus.APPROVED
        ? AdmissionStatus.ADMITTED
        : status === ProcessAdmissionStatus.REJECTED
          ? AdmissionStatus.REJECTED
          : AdmissionStatus.IN_REVIEW;

    await studentRepository.update(
      { userId: studentId },
      { admissionStatus, matriculationNumber, level: Level.ONE_HUNDRED_LEVEL }
    );
    if (status === ProcessAdmissionStatus.APPROVED) {
      await sendEMail({
        from: 'tech@revclient.com',
        to: student.email,
        subject: 'Welcome to eUniversity Africa',
        html: admissionLetter
      });
    }

    // if (status === ProcessAdmissionStatus.APPROVED) {
    //   await sendGridClient.send({
    //     to: student.email,
    //     from: EMAIL_FROM,
    //     subject: 'Welcome to eUniversity Africa',
    //     html: admissionLetter
    //   });
    // }

    return res.status(HTTP_STATUS.OK.code).send({
      message: 'Admission processed successfully'
    });
  } catch (error) {
    logger.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code)
      .send({ message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message });
  }
};
