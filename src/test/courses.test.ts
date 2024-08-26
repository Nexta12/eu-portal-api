/* eslint-disable sonarjs/no-duplicate-string */
import { HTTP_STATUS } from '../utils';
import { TestFactory } from './factory';
import {
  createCourseTest,
  createProgrammeTest,
  generateStaffAuthToken,
  generateStudentAuthToken,
  randomUuid,
  testCourse
} from './testUtil';

describe('Courses Routes', () => {
  const createCourseRoute = '/courses/create';

  describe('GET /courses', () => {
    const factory: TestFactory = new TestFactory();
    const getCoursesRoute = '/courses';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return an array of courses', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      await createCourseTest(factory, programmeId);

      const res = await factory.app
        .get(getCoursesRoute)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.length).toBe(1);
    });

    it('should return an empty array if no courses exist', async () => {
      const res = await factory.app
        .get(getCoursesRoute)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /courses/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a course if valid id is provided', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const courseId = await createCourseTest(factory, programmeId);

      const res = await factory.app
        .get(`/courses/${courseId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.id).toBe(courseId);
    });

    it('should return 404 if invalid id is provided', async () => {
      const res = await factory.app
        .get(`${createCourseRoute}/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
    });
  });

  describe('POST /courses/create', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return 201 if course is created successfully', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      await createCourseTest(factory, programmeId);
    });

    it('should return 404 if any of the programmes does not exist', async () => {
      const res = await factory.app
        .post(createCourseRoute)
        .send({ ...testCourse, programme: randomUuid })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({ message: 'Programme does not exist' });
    });

    it('should return 401 if user is not logged in', async () => {
      const res = await factory.app.post(createCourseRoute).send(testCourse);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .post(createCourseRoute)
        .send(testCourse)
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return 403 if user is not staff or admin', async () => {
      const res = await factory.app
        .post(createCourseRoute)
        .send(testCourse)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });

    it('should return 422 if validation fails', async () => {
      const res = await factory.app
        .post(createCourseRoute)
        .send({ name: 'test course' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toMatchObject({
        code: 'code is required',
        unit: 'unit is required',
        programme: 'programme is required',
        level: 'level should be 100L, 200L, 300L, 400L or 500L',
        cohort: 'cohort should be certificate, diploma, degree or postgraduate'
      });
    });

    it('should return 409 if course already exists', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      await createCourseTest(factory, programmeId);

      const res = await factory.app
        .post(createCourseRoute)
        .send({ ...testCourse, programme: programmeId })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(res.body.message).toBe('Course with given code or name already exists');
    });
  });

  describe('PUT /courses/update/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return 200 if course is updated successfully', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const courseId = await createCourseTest(factory, programmeId);

      const res = await factory.app
        .put(`/courses/update/${courseId}`)
        .send({ name: 'updated course' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.data.name).toBe('updated course');
    });

    it('should return 404 if course does not exist', async () => {
      const res = await factory.app
        .put(`/courses/update/${randomUuid}`)
        .send({ name: 'updated course' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Course does not exist');
    });

    it('should return 401 if user is not logged in', async () => {
      const res = await factory.app
        .put(`/courses/update/${randomUuid}`)
        .send({ name: 'updated course' });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .put(`/courses/update/${randomUuid}`)
        .send({ name: 'updated course' })
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return 403 if user is not staff or admin', async () => {
      const res = await factory.app
        .put(`/courses/update/${randomUuid}`)
        .send({ name: 'updated course' })
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });

    it('should return 422 if validation fails', async () => {
      const res = await factory.app
        .put(`/courses/update/${randomUuid}`)
        .send({ level: '100' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toMatchObject({
        level: 'level should be 100L, 200L, 300L, 400L or 500L'
      });
    });
  });

  describe('DELETE /courses/delete/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return 200 if course is deleted successfully', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const courseId = await createCourseTest(factory, programmeId);

      const res = await factory.app
        .delete(`/courses/delete/${courseId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
    });

    it('should return 404 if course does not exist', async () => {
      const res = await factory.app
        .delete(`/courses/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
    });

    it('should return 401 if user is not logged in', async () => {
      const res = await factory.app.delete(`/courses/delete/${randomUuid}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .delete(`/courses/delete/${randomUuid}`)
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return 403 if user is not staff or admin', async () => {
      const res = await factory.app
        .delete(`/courses/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });
  });
});
