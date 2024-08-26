import { HTTP_STATUS } from '../utils';
import { TestFactory } from './factory';
import {
  authorizationHeaderError,
  createCourseTest,
  createStudentTest,
  generateStaffAuthToken,
  generateStudentAuthToken,
  randomUuid,
  testCourse
} from './testUtil';

const registerForSemester = async (factory: TestFactory, userId: string) => {
  const res = await factory.app
    .post('/academics/semester-registration')
    .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
  expect(res.status).toBe(HTTP_STATUS.CREATED.code);
  expect(res.body).toBeDefined();
  return res.body.data.id;
};

describe('Academics routes', () => {
  describe('POST /academics/semester-registration', () => {
    const factory: TestFactory = new TestFactory();
    const registrationRoute = '/academics/semester-registration';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should register a student for a semester', async () => {
      const { userId } = await createStudentTest(factory);
      await registerForSemester(factory, userId);
    });

    it('should return an error if the student is already registered for the semester', async () => {
      const { userId } = await createStudentTest(factory);
      await factory.app
        .post(registrationRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      const res = await factory.app
        .post(registrationRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(res.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(res.body).toMatchObject({
        message: 'This student is already registered for an active semester'
      });
    });

    it('Should be unauthorised if the user is not a student', async () => {
      const res = await factory.app
        .post(registrationRoute)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });

    it('Should be unauthorized if the user is not logged in', async () => {
      const res = await factory.app.post(registrationRoute);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: authorizationHeaderError });
    });
  });

  describe('GET /academics/current-semester', () => {
    const factory: TestFactory = new TestFactory();
    const currentSemesterRoute = '/academics/current-semester';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return the current semester', async () => {
      const { userId, programmeId } = await createStudentTest(factory);
      await createCourseTest(factory, programmeId);
      await registerForSemester(factory, userId);
      const res = await factory.app
        .get(currentSemesterRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('semester');
      expect(res.body).toHaveProperty('level');
      expect(Array.isArray(res.body.bills)).toBeTruthy();
      expect(res.body.bills[0]).toMatchObject({
        id: expect.any(String),
        type: 'Tuition Fee',
        description: 'New semester tuition fee',
        amountUsd: 50,
        dueDate: null,
        isPaid: false,
        paidAt: null,
        referenceNumber: null
      });
      expect(Array.isArray(res.body.courses)).toBeTruthy();
      expect(res.body.courses[0]).toEqual({
        semesterCourseId: expect.any(String),
        name: 'test course',
        code: 'TEST1234',
        description: 'test course description',
        unit: 3,
        costUsd: 4,
        isCompulsory: true,
        isPaid: false,
        isEnrolled: false,
        isCompleted: false
      });
    });

    it('should return an error if there is no current semester', async () => {
      const res = await factory.app
        .get(currentSemesterRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({
        message: 'This student has no active semester'
      });
    });

    it('should return an error if the user is not logged in', async () => {
      const res = await factory.app.get(currentSemesterRoute);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: authorizationHeaderError });
    });
  });

  describe('PUT /academics/course-registration', () => {
    const factory: TestFactory = new TestFactory();
    const semesterCourses = '/academics/course-registration';
    const currentSemesterRoute = '/academics/current-semester';

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const getCourseToUpdate = (academicSessionId: string, semesterCourseId: string) => ({
      academicSessionId,
      courses: [
        {
          semesterCourseId,
          isEnrolled: true,
          isCompleted: false,
          isPaid: false,
          costUsd: testCourse.costUsd,
          code: testCourse.code
        }
      ]
    });

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should update the semester courses', async () => {
      const { userId, programmeId } = await createStudentTest(factory);
      await createCourseTest(factory, programmeId);
      const academicSessionId = await registerForSemester(factory, userId);

      const currentSemesterRes = await factory.app
        .get(currentSemesterRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(currentSemesterRes.status).toBe(HTTP_STATUS.OK.code);
      expect(currentSemesterRes.body.courses).toHaveLength(1);

      const currentCourseToUpdate = getCourseToUpdate(
        academicSessionId,
        currentSemesterRes.body.courses[0].semesterCourseId
      );
      const res = await factory.app
        .put(semesterCourses)
        .send(currentCourseToUpdate)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.message).toEqual('Semester courses enrolled successfully');
    });

    it('should return validation errors if the request body is invalid', async () => {
      const res = await factory.app
        .put(semesterCourses)
        .send({
          courses: [
            {
              semesterCourseId: 1,
              isPaid: false
            }
          ]
        })
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toEqual({
        academicSessionId: 'academicSessionId is required',
        'courses[0].isEnrolled': 'courses must have isEnrolled',
        'courses[0].isCompleted': 'courses must have isCompleted',
        'courses[0].costUsd': 'courses must have costUsd',
        'courses[0].code': 'courses must have code'
      });
    });

    it('should return an error if the user is not logged in', async () => {
      const res = await factory.app.put(semesterCourses);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: authorizationHeaderError });
    });

    it('should return an error academicSessionId is not found', async () => {
      const { userId, programmeId } = await createStudentTest(factory);
      await createCourseTest(factory, programmeId);
      await registerForSemester(factory, userId);
      const courseToUpdate = getCourseToUpdate(randomUuid, randomUuid);
      const res = await factory.app
        .put(semesterCourses)
        .send(courseToUpdate)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({
        message: 'Academic session not found'
      });
    });
  });
});
