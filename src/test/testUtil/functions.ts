import jwt from 'jsonwebtoken';

import { JWT_KEY } from '../../config/data';
import { UserRole } from '../../entities';
import { HTTP_STATUS } from '../../utils';
import { TestFactory } from '../factory';
import {
  randomUuid,
  testAdmin,
  testCourse,
  testFaculty,
  testProgramme,
  testStaff,
  testStudent
} from './testConstants';

export const generateAdminAuthToken = (userId = randomUuid): string => {
  const payload = {
    userId,
    firstName: testAdmin.firstName,
    lastName: testAdmin.lastName,
    role: testAdmin.role,
    email: testAdmin.email
  };
  return jwt.sign(payload, JWT_KEY);
};

export const generateStaffAuthToken = (userId = randomUuid): string => {
  const payload = {
    userId,
    firstName: testStaff.firstName,
    lastName: testStaff.lastName,
    role: testStaff.role,
    email: testStaff.email
  };
  return jwt.sign(payload, JWT_KEY);
};

export const generateStudentAuthToken = (userId = randomUuid): string => {
  const payload = {
    userId,
    firstName: testStudent.firstName,
    lastName: testStudent.lastName,
    role: testStudent.role,
    email: testStudent.email
  };
  return jwt.sign(payload, JWT_KEY);
};

export const createStaffTest = async (factory: TestFactory, role = UserRole.STAFF) => {
  const createStaffRoute = '/staffs/create';
  const userData = role === UserRole.ADMIN ? testAdmin : testStaff;
  const response = await factory.app
    .post(createStaffRoute)
    .send(userData)
    .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
  expect(response.status).toBe(HTTP_STATUS.CREATED.code);
  expect(response.body.data).toHaveProperty('userId');
  return response.body.data.userId;
};

export const createFacultyTest = async (factory: TestFactory) => {
  const createFacultyRoute = '/faculties/create';
  const userId = await createStaffTest(factory, UserRole.ADMIN);

  const newFacultyRes = await factory.app
    .post(createFacultyRoute)
    .send(testFaculty)
    .set('Authorization', `Bearer ${generateAdminAuthToken(userId)}`);
  expect(newFacultyRes.status).toBe(HTTP_STATUS.CREATED.code);
  expect(newFacultyRes.body.data).toMatchObject({
    id: expect.any(String),
    name: testFaculty.name
  });

  return newFacultyRes.body.data.id;
};

export const createProgrammeTest = async (factory: TestFactory) => {
  const createProgrammeRoute = '/programmes/create';
  const facultyId = await createFacultyTest(factory);
  const res = await factory.app
    .post(createProgrammeRoute)
    .send({ ...testProgramme, faculty: facultyId })
    .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
  expect(res.status).toBe(HTTP_STATUS.CREATED.code);
  expect(res.body.data).toMatchObject({
    id: expect.any(String),
    name: testProgramme.name
  });

  return { facultyId, programmeId: res.body.data.id };
};

export const createStudentTest = async (factory: TestFactory) => {
  const { programmeId } = await createProgrammeTest(factory);
  const response = await factory.app
    .post('/students/create')
    .send({ ...testStudent, programme: programmeId });
  expect(response.status).toBe(HTTP_STATUS.CREATED.code);
  expect(response.body).toMatchObject({ message: HTTP_STATUS.CREATED.message });
  expect(response.body.data).toHaveProperty('userId');
  return { userId: response.body.data.userId, programmeId };
};

export const createCourseTest = async (factory: TestFactory, programmeId: string) => {
  const createCourseRoute = '/courses/create';
  const res = await factory.app
    .post(createCourseRoute)
    .send({ ...testCourse, programme: programmeId })
    .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
  expect(res.status).toBe(HTTP_STATUS.CREATED.code);
  expect(res.body).toMatchObject({
    message: HTTP_STATUS.CREATED.message,
    data: {
      id: expect.any(String),
      name: testCourse.name,
      code: testCourse.code
    }
  });
  return res.body.data.id;
};
