import { HTTP_STATUS } from '../utils';
import { TestFactory } from './factory';
import {
  createStudentTest,
  generateAdminAuthToken,
  generateStudentAuthToken,
  randomUuid,
  testStudent
} from './testUtil';

const createStudentRoute = '/students/create';

describe('Students route', () => {
  describe('[GET] /students', () => {
    const factory: TestFactory = new TestFactory();
    const getStudentsRoute = '/students';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should be able to fetch all users of an empty database', async () => {
      const response = await factory.app
        .get(getStudentsRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toEqual([]);
    });

    it('should be able to fetch all users of a non-empty database', async () => {
      await createStudentTest(factory);
      const response = await factory.app
        .get(getStudentsRoute)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        userId: expect.any(String),
        firstName: testStudent.firstName,
        lastName: testStudent.lastName,
        email: testStudent.email,
        role: testStudent.role
      });
    });
  });

  describe('[POST] /students/create', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should create a user when data is complete', async () => {
      /* await createProgrammeTest(factory);
      const response = await factory.app
        .post(createStudentRoute)
        .send({ ...testStudent, dateOfBirth: '1994-03-12' });
      expect(response.status).toBe(HTTP_STATUS.CREATED.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.CREATED.message });
      expect(response.body.data).toHaveProperty('userId'); */
      await createStudentTest(factory);
    });

    it('should not create a user when data is incomplete', async () => {
      const newUser = {
        lastName: 'Doe',
        email: 'john'
      };
      const response = await factory.app.post(createStudentRoute).send(newUser);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toMatchObject({
        firstName: 'firstName must be a string',
        email: 'This must be a proper email address'
      });
    });

    it('should not create a user when email or password is invalid', async () => {
      const invalidUser = {
        ...testStudent,
        password: '123',
        programme: randomUuid
      };
      const response = await factory.app.post(createStudentRoute).send(invalidUser);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toEqual({
        password: 'Password must have a minimum length of 6'
      });
    });

    it('should not create a user when email already exists', async () => {
      const { programmeId } = await createStudentTest(factory);
      const response2 = await factory.app
        .post(createStudentRoute)
        .send({ ...testStudent, programme: programmeId });
      expect(response2.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(response2.body.errors).toMatchObject({ email: 'Email already exists' });
    });

    it('should return a 404 error when student programme is not found', async () => {
      const newUser = {
        ...testStudent,
        programme: randomUuid
      };
      const response = await factory.app.post(createStudentRoute).send(newUser);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body.errors).toMatchObject({ programme: 'Programme not found' });
    });
  });

  describe('[GET] /students/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a 404 when user is not found', async () => {
      const response = await factory.app
        .get(`/students/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return a 200 when user is found', async () => {
      const { userId } = await createStudentTest(factory);

      const response = await factory.app
        .get(`/students/${userId}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toMatchObject({
        message: HTTP_STATUS.OK.message,
        data: {
          userId,
          firstName: testStudent.firstName,
          lastName: testStudent.lastName,
          email: testStudent.email,
          role: testStudent.role
        }
      });
    });
  });

  describe('[PUT] /students/update/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a 404 when updating a user that does not exist', async () => {
      const response = await factory.app
        .put(`/students/update/${randomUuid}`)
        .send(testStudent)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should update user when it has proper data', async () => {
      const { userId } = await createStudentTest(factory);

      const newUser = {
        firstName: 'Paul',
        lastName: 'Morphy',
        country: 'Nigeria'
      };
      const response = await factory.app
        .put(`/students/update/${userId}`)
        .send(newUser)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toMatchObject({
        message: HTTP_STATUS.OK.message,
        data: {
          userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          country: newUser.country
        }
      });
    });

    it('should update user when data is incomplete', async () => {
      const { userId } = await createStudentTest(factory);

      const newUser = {
        firstName: 'Paul'
      };
      const response = await factory.app
        .put(`/students/update/${userId}`)
        .send(newUser)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
    });

    it('should throw error when optional property employmentStatus has wrong value', async () => {
      const { userId } = await createStudentTest(factory);

      const newUser = {
        firstName: 'Paul',
        lastName: 'Morphy',
        employmentStatus: 'looking for work'
      };
      const response = await factory.app
        .put(`/students/update/${userId}`)
        .send(newUser)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toMatchObject({
        employmentStatus: 'employmentStatus must be employed, unemployed or self-employed'
      });
    });

    it('should not allow update when user is not logged in', async () => {
      const newUser = {
        firstName: 'Paul',
        lastName: 'Morphy',
        email: 'paul'
      };
      const response = await factory.app.put(`/students/update/${randomUuid}`).send(newUser);
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(response.body).toMatchObject({ message: 'Authorization header not provided' });
    });
  });

  describe('[DELETE] /students/delete/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a 404 when deleting a user that does not exist', async () => {
      const response = await factory.app
        .delete(`/students/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should delete user when it exists', async () => {
      const { userId } = await createStudentTest(factory);

      const response = await factory.app
        .delete(`/students/delete/${userId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);

      const getUserRes = await factory.app
        .get(`/students/${userId}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(getUserRes.status).toBe(HTTP_STATUS.NOT_FOUND.code);
    });

    it('should not allow delete when user is not admin', async () => {
      const response = await factory.app
        .delete(`/students/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });
  });
});
