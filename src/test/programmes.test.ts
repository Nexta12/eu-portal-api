/* eslint-disable sonarjs/no-duplicate-string */
import { HTTP_STATUS } from '../utils';
import { TestFactory } from './factory';
import {
  createCourseTest,
  createProgrammeTest,
  generateAdminAuthToken,
  generateStaffAuthToken,
  generateStudentAuthToken,
  randomUuid,
  testProgramme
} from './testUtil';

describe('Programmes routes', () => {
  const createProgrammeRoute = '/programmes/create';

  describe('GET /programmes', () => {
    const factory: TestFactory = new TestFactory();
    const getFacultiesRoute = '/programmes';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return an array of programmes', async () => {
      await createProgrammeTest(factory);

      const res = await factory.app.get(getFacultiesRoute);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.length).toBe(1);
    });

    it('should return an empty array if no programmes exist', async () => {
      const res = await factory.app.get(getFacultiesRoute);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /programmes/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a programme if valid id is provided', async () => {
      const { programmeId } = await createProgrammeTest(factory);

      const res = await factory.app.get(`/programmes/${programmeId}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: testProgramme.name
      });
    });

    it('should return a 404 error if invalid id is provided', async () => {
      const res = await factory.app.get(`/programmes/${randomUuid}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Programme with given id not found');
    });
  });

  describe('GET /programmes/:id/courses', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a programme with its courses if valid id is provided', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      await createCourseTest(factory, programmeId);

      const res = await factory.app.get(`/programmes/${programmeId}/courses`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: testProgramme.name,
        courses: expect.any(Array)
      });

      const res2 = await factory.app.get(`/programmes/${programmeId}/courses?cohort=degree`);
      expect(res2.status).toBe(HTTP_STATUS.OK.code);
    });

    it('should return a 404 error if invalid id is provided', async () => {
      const res = await factory.app.get(`/programmes/${randomUuid}/courses`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Programme with given id not found');
    });
  });

  describe('POST /programmes/create', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should create a programme successfully', async () => {
      await createProgrammeTest(factory);
    });

    it('should return a 404 error if faculty does not exist', async () => {
      const res = await factory.app
        .post(createProgrammeRoute)
        .send({ ...testProgramme, faculty: randomUuid })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Faculty with given id does not exist');
    });

    it('should return a 401 status code if user is not logged in', async () => {
      const res = await factory.app.post(createProgrammeRoute).send(testProgramme);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .post(createProgrammeRoute)
        .send(testProgramme)
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return a 403 status code if user is not a staff or admin', async () => {
      const res = await factory.app
        .post(createProgrammeRoute)
        .send(testProgramme)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });

    it('should return a 422 status code if validation fails', async () => {
      const res = await factory.app
        .post(createProgrammeRoute)
        .send({ ...testProgramme, name: '' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toMatchObject({ name: 'programme name should be a string' });
    });

    it('should return 409 status code if programme already exists', async () => {
      const { facultyId } = await createProgrammeTest(factory);

      const res2 = await factory.app
        .post(createProgrammeRoute)
        .send({ ...testProgramme, faculty: facultyId })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res2.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(res2.body.message).toEqual('Programme with given name already exists');
    });
  });

  describe('PUT /programmes/update/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should update a programme successfully', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const res = await factory.app
        .put(`/programmes/update/${programmeId}`)
        .send({ name: 'New Name', code: 'New Code' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.data).toMatchObject({ id: programmeId, name: 'New Name', code: 'New Code' });
    });

    it('should return a 404 error if programme does not exist', async () => {
      const res = await factory.app
        .put(`/programmes/update/${randomUuid}`)
        .send({ name: 'New Name', code: 'New Code' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Programme with given id not found');
    });

    it('should return a 401 status code if user is not logged in', async () => {
      const res = await factory.app
        .put(`/programmes/update/${randomUuid}`)
        .send({ name: 'New Name', code: 'New Code' });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .put(`/programmes/update/${randomUuid}`)
        .send({ name: 'New Name', code: 'New Code' })
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return a 403 status code if user is not a staff or admin', async () => {
      const res = await factory.app
        .put(`/programmes/update/${randomUuid}`)
        .send({ name: 'New Name', code: 'New Code' })
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });

    it('should return a 422 status code if validation fails', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const res = await factory.app
        .put(`/programmes/update/${programmeId}`)
        .send({ name: '', code: 'New Code', isCertificate: 'yes' })
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toMatchObject({
        name: 'programme name should be a string',
        isCertificate: 'isCertificate should be a boolean'
      });
    });
  });

  describe('DELETE /programmes/delete/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should delete a programme successfully', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      const res = await factory.app
        .delete(`/programmes/delete/${programmeId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body.message).toBe('Programme deleted successfully');
    });

    it('should return 400 error if programme has courses or students', async () => {
      const { programmeId } = await createProgrammeTest(factory);
      await createCourseTest(factory, programmeId);

      const res = await factory.app
        .delete(`/programmes/delete/${programmeId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST.code);
      expect(res.body.message).toBe('You can not delete a programme that has courses');
    });

    it('should return a 404 error if programme does not exist', async () => {
      const res = await factory.app
        .delete(`/programmes/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body.message).toBe('Programme with given id not found');
    });

    it('should return a 401 status code if user is not logged in', async () => {
      const res = await factory.app.delete(`/programmes/delete/${randomUuid}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe('Authorization header not provided');

      const res2 = await factory.app
        .delete(`/programmes/delete/${randomUuid}`)
        .set('Authorization', 'Bearer invalid-token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body.message).toBe(HTTP_STATUS.UNAUTHORIZED.message);
    });

    it('should return a 403 status code if user is not an admin', async () => {
      const res = await factory.app
        .delete(`/programmes/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body.message).toBe(HTTP_STATUS.FORBIDDEN.message);
    });
  });
});
