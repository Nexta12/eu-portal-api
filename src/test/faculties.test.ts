/* eslint-disable sonarjs/no-duplicate-string */
import { HTTP_STATUS } from '../utils';
import { TestFactory } from './factory';
import {
  createFacultyTest,
  createProgrammeTest,
  generateAdminAuthToken,
  generateStaffAuthToken,
  generateStudentAuthToken,
  randomUuid,
  testFaculty
} from './testUtil';

describe('Faculties routes', () => {
  const createFacultyRoute = '/faculties/create';
  const newFaculty = testFaculty;

  describe('GET /faculties', () => {
    const factory: TestFactory = new TestFactory();
    const getFacultiesRoute = '/faculties';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return empty array if database is empty', async () => {
      const res = await factory.app.get(getFacultiesRoute);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toEqual([]);
    });

    it('should return array of faculties if database is not empty', async () => {
      await createFacultyTest(factory);

      const res = await factory.app.get(getFacultiesRoute);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /faculties/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return 404 error if faculty with given id does not exist in database', async () => {
      const res = await factory.app.get(`/faculties/${randomUuid}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return faculty object if faculty with given id exist in database', async () => {
      const facultyId = await createFacultyTest(factory);

      const res = await factory.app.get(`/faculties/${facultyId}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.OK.message });
      expect(res.body.data).toMatchObject({ name: newFaculty.name });
    });
  });

  describe('POST /faculties/create', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return 401 error if user is not logged in', async () => {
      const res = await factory.app.post('/faculties/create').send(newFaculty);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: 'Authorization header not provided' });

      const res2 = await factory.app
        .post(createFacultyRoute)
        .send(newFaculty)
        .set('Authorization', 'Bearer invalid_token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body).toMatchObject({ message: HTTP_STATUS.UNAUTHORIZED.message });
    });

    it('should return 403 error if user is not staff or admin', async () => {
      const res = await factory.app
        .post(createFacultyRoute)
        .send(newFaculty)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });

    it('should return 409 error if faculty with given name already exist in database', async () => {
      await createFacultyTest(factory);

      const res2 = await factory.app
        .post(createFacultyRoute)
        .send(newFaculty)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res2.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(res2.body).toMatchObject({ message: 'Faculty with given name already exist' });
    });

    it('should return 201 status code if faculty is created successfully', async () => {
      await createFacultyTest(factory);
    });

    it('should return 422 error if faculty name is not provided', async () => {
      const res = await factory.app
        .post(createFacultyRoute)
        .send({})
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(res.body.errors).toMatchObject({ name: 'name is required' });
    });
  });

  describe('PUT /faculties/update/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should update faculty successfully', async () => {
      const facultyId = await createFacultyTest(factory);
      const updatedFaculty = { name: 'updated faculty name' };

      const res = await factory.app
        .put(`/faculties/update/${facultyId}`)
        .send(updatedFaculty)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toMatchObject({ message: 'Faculty updated successfully' });

      const res2 = await factory.app.get(`/faculties/${facultyId}`);
      expect(res2.status).toBe(HTTP_STATUS.OK.code);
      expect(res2.body.data).toMatchObject(updatedFaculty);
    });

    it('should return 404 error if faculty with given id does not exist in database', async () => {
      const res = await factory.app
        .put(`/faculties/update/${randomUuid}`)
        .send(newFaculty)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return 401 error if user is not logged in', async () => {
      const facultyId = await createFacultyTest(factory);

      const res = await factory.app.put(`/faculties/update/${facultyId}`).send(newFaculty);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: 'Authorization header not provided' });

      const res2 = await factory.app
        .put(`/faculties/update/${facultyId}`)
        .send(newFaculty)
        .set('Authorization', 'Bearer invalid_token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body).toMatchObject({ message: HTTP_STATUS.UNAUTHORIZED.message });
    });

    it('should return 403 error if user is not admin or staff', async () => {
      const res = await factory.app
        .put(`/faculties/update/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });
  });

  describe('DELETE /faculties/delete', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should successfully delete faculty from database', async () => {
      const facultyId = await createFacultyTest(factory);

      const res = await factory.app
        .delete(`/faculties/delete/${facultyId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toMatchObject({ message: 'Faculty deleted successfully' });

      const res2 = await factory.app.get(`/faculties/${facultyId}`);
      expect(res2.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res2.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return 404 error if faculty with given id does not exist in database', async () => {
      const res = await factory.app
        .delete(`/faculties/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return 401 error if user is not logged in', async () => {
      const facultyId = await createFacultyTest(factory);

      const res = await factory.app.delete(`/faculties/delete/${facultyId}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body).toMatchObject({ message: 'Authorization header not provided' });

      const res2 = await factory.app
        .delete(`/faculties/delete/${facultyId}`)
        .set('Authorization', 'Bearer invalid_token');
      expect(res2.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res2.body).toMatchObject({ message: HTTP_STATUS.UNAUTHORIZED.message });
    });

    it('should return 403 error if user is not admin', async () => {
      const facultyId = await createFacultyTest(factory);

      const res = await factory.app
        .delete(`/faculties/delete/${facultyId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(res.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });

    it('should return 400 error when faculty has programmes', async () => {
      const { facultyId } = await createProgrammeTest(factory);

      const res = await factory.app
        .delete(`/faculties/delete/${facultyId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST.code);
      expect(res.body).toMatchObject({ message: 'Cannot delete faculty with programmes' });
    });
  });
});
