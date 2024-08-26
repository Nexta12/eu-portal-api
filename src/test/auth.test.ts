import { HTTP_STATUS, MINIMUM_PASSWORD_LENGTH } from '../utils';
import { TestFactory } from './factory';
import {
  createStudentTest,
  generateAdminAuthToken,
  generateStudentAuthToken,
  testStaff,
  testStudent
} from './testUtil';

describe('Auth', () => {
  describe('POST /login', () => {
    const factory: TestFactory = new TestFactory();
    const loginRoute = '/auth/login';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a token when the request data is valid for student', async () => {
      await createStudentTest(factory);

      const response = await factory.app.post(loginRoute).send({
        email: testStudent.email,
        // todo: change password to the previous one here when sending email has been fixed
        password: 'student123'
      });
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.data).toBeDefined();
    });

    it('should return a token when the request data is valid for and staff', async () => {
      const createStaffRes = await factory.app
        .post('/staffs/create')
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(createStaffRes.status).toBe(201);

      const response2 = await factory.app.post(loginRoute).send({
        email: testStaff.email,
        password: testStaff.password
      });
      expect(response2.status).toBe(200);
      expect(response2.body.token).toBeDefined();
      expect(response2.body.data).toBeDefined();
    });

    it('should return an error when the email is not found', async () => {
      const response = await factory.app.post(loginRoute).send({
        email: 'abc@gmail.com',
        password: 'pass12345',
        userType: 'student'
      });
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST.code);
      expect(response.body.message).toBe('Invalid login credentials');
    });

    it('should return an error when the password is incorrect', async () => {
      await createStudentTest(factory);
      const response = await factory.app.post(loginRoute).send({
        email: testStudent.email,
        password: 'wrongPassword'
      });
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST.code);
      expect(response.body.message).toBe('Invalid login credentials');
    });
    it('should return an error when login data is invalid', async () => {
      const response = await factory.app.post(loginRoute).send({
        email: 'abc@gmail',
        password: 'wrongPassword'
      });
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toStrictEqual({
        email: 'This must be a valid email address'
      });
    });
  });

  describe('PUT /change-password', () => {
    const factory: TestFactory = new TestFactory();
    const changePasswordRoute = '/auth/change-password';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should properly change the password when the request data is valid', async () => {
      const { userId } = await createStudentTest(factory);
      const newPasswordRequest = {
        // todo: change password to the previous one here when sending email has been fixed
        currentPassword: 'student123',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123'
      };
      const response = await factory.app
        .put(changePasswordRoute)
        .send(newPasswordRequest)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body.message).toBe('Password changed successfully');

      const response2 = await factory.app.post('/auth/login').send({
        email: testStudent.email,
        password: newPasswordRequest.newPassword
      });
      expect(response2.status).toBe(200);
      expect(response2.body.token).toBeDefined();
    });

    it('should return an error when the old password is incorrect', async () => {
      const { userId } = await createStudentTest(factory);
      const newPasswordRequest = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123'
      };
      const response = await factory.app
        .put(changePasswordRoute)
        .send(newPasswordRequest)
        .set('Authorization', `Bearer ${generateStudentAuthToken(userId)}`);
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST.code);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should return an error when new password is not the same as confirm password', async () => {
      const newPasswordRequest = {
        currentPassword: 'pass12345',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword1234'
      };
      const response = await factory.app
        .put(changePasswordRoute)
        .send(newPasswordRequest)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toEqual({
        newPassword: 'New password and confirm new password must be the same'
      });
    });

    it('should return error when request data is invalid', async () => {
      const newPasswordRequest = {
        currentPassword: 'pass',
        newPassword: '',
        confirmNewPassword: 'newPassword1234'
      };
      const response = await factory.app
        .put(changePasswordRoute)
        .send(newPasswordRequest)
        .set('Authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toEqual({
        currentPassword: `Password must have a minimum length of ${MINIMUM_PASSWORD_LENGTH}`,
        newPassword: 'New password is required'
      });
    });

    it('should return an error when the user is not authenticated', async () => {
      const newPasswordRequest = {
        currentPassword: 'pass12345',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123'
      };
      const response = await factory.app.put(changePasswordRoute).send(newPasswordRequest);
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(response.body.message).toEqual('Authorization header not provided');
    });
  });

  describe('[GET] /checkDuplicateEmail', () => {
    const factory: TestFactory = new TestFactory();
    const duplicateEmailRoute = `/auth/email/${testStudent.email}`;

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return a 200 when email does not exist', async () => {
      const response = await factory.app
        .get(duplicateEmailRoute)
        .send({ email: testStudent.email });
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.OK.message });
    });

    it('should return a 409 when email already exists', async () => {
      await createStudentTest(factory);
      const response = await factory.app
        .get(duplicateEmailRoute)
        .send({ email: testStudent.email });
      expect(response.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(response.body.errors).toMatchObject({ email: 'Email already exists' });
    });
  });
});
