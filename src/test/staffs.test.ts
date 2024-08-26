import { HTTP_STATUS, MINIMUM_PASSWORD_LENGTH } from '../utils';
import { TestFactory } from './factory';
import { generateAdminAuthToken, generateStaffAuthToken, randomUuid, testStaff } from './testUtil';

const createStaffRoute = '/staffs/create';
const passwordErrorMessage = `Password must have a minimum length of ${MINIMUM_PASSWORD_LENGTH}`;

describe('Staffs route', () => {
  describe('[GET] /staffs', () => {
    const factory: TestFactory = new TestFactory();
    const getStaffsRoute = '/staffs';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return an empty array when there are no staffs', async () => {
      const response = await factory.app.get(getStaffsRoute);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toEqual([]);
    });

    it('should return an array of staffs when there are staffs', async () => {
      const createUserRes = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(createUserRes.status).toBe(HTTP_STATUS.CREATED.code);

      const response = await factory.app.get(getStaffsRoute);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('[POST] /staffs/create', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should create a new staff when the request data is valid', async () => {
      const response = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.CREATED.code);
      expect(response.body.data).toHaveProperty('userId');
    });

    it('should return an error when the request data is incomplete', async () => {
      const response = await factory.app
        .post(createStaffRoute)
        .send({
          lastName: 'Mandy',
          email: 'alice@gmail.com'
        })
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toMatchObject({
        firstName: 'firstName must be a string',
        password: passwordErrorMessage
      });
    });

    it('should return an error when the request data is invalid', async () => {
      const response = await factory.app
        .post(createStaffRoute)
        .send({
          firstName: 'Alice',
          lastName: 'Mandy',
          email: 'alice',
          password: '123',
          role: 'superadmin'
        })
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY.code);
      expect(response.body.errors).toMatchObject({
        email: 'This must be a valid email address',
        password: passwordErrorMessage,
        role: 'Role must be either admin or staff'
      });
    });

    it('should return an error when the email is already in use', async () => {
      const response1 = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response1.status).toBe(HTTP_STATUS.CREATED.code);
      const response2 = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response2.status).toBe(HTTP_STATUS.CONFLICT.code);
      expect(response2.body.errors).toMatchObject({ message: 'Email already exists' });
    });

    it('should validate that only an admin can create a staff', async () => {
      const response = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.CREATED.code);
      expect(response.body.data).toHaveProperty('userId');
    });

    it('should return an error when the user is not an admin', async () => {
      const response = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });
  });

  describe('[GET] /staffs/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return an error when the staff is not found', async () => {
      const response = await factory.app
        .get(`/staffs/${randomUuid}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should return the correct staff when the staff is found', async () => {
      const res = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.CREATED.code);
      expect(res.body.data).toHaveProperty('userId');

      const staffId = res.body.data.userId;
      const response = await factory.app
        .get(`/staffs/${staffId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toMatchObject({
        message: HTTP_STATUS.OK.message,
        data: {
          userId: staffId,
          firstName: testStaff.firstName,
          lastName: testStaff.lastName,
          email: testStaff.email,
          role: 'staff'
        }
      });
    });
  });

  describe('[PUT] /staffs/:id', () => {
    const factory: TestFactory = new TestFactory();
    // const userId = 1;
    const updateStaffByIdRoute = `/staffs/update/${randomUuid}`;

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should update the staff when the request data is valid and the staff is found', async () => {
      const createUserRes = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      const { userId } = createUserRes.body.data;

      expect(createUserRes.status).toBe(HTTP_STATUS.CREATED.code);
      expect(createUserRes.body).toMatchObject({
        message: HTTP_STATUS.CREATED.message,
        data: {
          userId,
          email: testStaff.email,
          firstName: testStaff.firstName,
          lastName: testStaff.lastName
        }
      });

      const updatedData = {
        firstName: 'Alice',
        lastName: 'May'
      };
      const response = await factory.app
        .put(`/staffs/update/${userId}`)
        .send(updatedData)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);
      expect(response.body).toMatchObject({
        message: HTTP_STATUS.OK.message,
        data: {
          userId,
          firstName: updatedData.firstName,
          lastName: updatedData.lastName
        }
      });
    });

    it('should return a 404 error when the staff is not found', async () => {
      const response = await factory.app
        .put(updateStaffByIdRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should not be able to update staff if user is not admin or logged in', async () => {
      const createUserRes = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(createUserRes.status).toBe(HTTP_STATUS.CREATED.code);

      const response = await factory.app.put(updateStaffByIdRoute).send(testStaff);
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(response.body).toMatchObject({ message: 'Authorization header not provided' });
    });
  });

  describe('[DELETE] /staffs/:id', () => {
    const factory: TestFactory = new TestFactory();

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should delete the staff when it exist', async () => {
      const createUserRes = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      const { userId } = createUserRes.body.data;

      expect(createUserRes.status).toBe(HTTP_STATUS.CREATED.code);
      expect(createUserRes.body).toMatchObject({ data: { userId } });

      const response = await factory.app
        .delete(`/staffs/delete/${userId}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.OK.code);

      const getUserRes = await factory.app
        .get(`/staffs/${userId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(getUserRes.status).toBe(HTTP_STATUS.NOT_FOUND.code);
    });

    it('should return a 404 error when the staff is not found', async () => {
      const response = await factory.app
        .delete(`/staffs/delete/${randomUuid}`)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.NOT_FOUND.message });
    });

    it('should not delete the staff if user is not admin', async () => {
      const createUserRes = await factory.app
        .post(createStaffRoute)
        .send(testStaff)
        .set('Authorization', `Bearer ${generateAdminAuthToken()}`);
      const { userId } = createUserRes.body.data;
      expect(createUserRes.status).toBe(HTTP_STATUS.CREATED.code);

      const response = await factory.app
        .delete(`/staffs/delete/${userId}`)
        .set('Authorization', `Bearer ${generateStaffAuthToken()}`);
      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN.code);
      expect(response.body).toMatchObject({ message: HTTP_STATUS.FORBIDDEN.message });
    });
  });
});
