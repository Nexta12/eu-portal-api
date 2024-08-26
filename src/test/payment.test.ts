import axios from 'axios';

import MockAdapter from 'axios-mock-adapter';

import { initializePayment, verifyPayment } from '../controllers';
import { IExtendedRequest } from '../types/JwtPayload';
import { HTTP_STATUS, PAYSTACK_BASE_URL } from '../utils';
import { TestFactory } from './factory';
import {
  authorizationHeaderError,
  createStudentTest,
  generateStudentAuthToken,
  testStudent
} from './testUtil';

const initializePaymentAndGetResponse = async () => {
  const payload = {
    amount: 100,
    description: 'Test payment'
  };

  const mockedRequest = {
    body: payload,
    jwtPayload: {
      userId: 'abc123',
      email: testStudent.email
    }
  } as IExtendedRequest;

  const mockedResponse = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn()
  } as any;

  await initializePayment(mockedRequest, mockedResponse);

  return { mockedResponse, payload };
};

describe('Payment route', () => {
  /* const paystackPaymentInitializedRes = {
    success: true,
    message: 'Payment initialized successfully',
    data: {
      authorization_url: 'https://checkout.paystack.com/test_access_code',
      access_code: 'test_access_code',
      reference: 'test_reference'
    }
  }; */

  describe('POST /initialize', () => {
    const factory: TestFactory = new TestFactory();
    const mockAxios = new MockAdapter(axios);

    beforeEach(async () => {
      await factory.init();
      mockAxios.reset();
    });

    afterEach(async () => {
      await factory.close();
    });

    /* it('should initialize payment successfully and return the payment url', async () => {
      await createStudentTest(factory);
      mockAxios
        .onPost(`${PAYSTACK_BASE_URL}/transaction/initialize`)
        .reply(200, paystackPaymentInitializedRes);

      // Call the controller function with the mocked req and res objects
      const { mockedResponse, payload } = await initializePaymentAndGetResponse();

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment initialized successfully',
        data: {
          url: paystackPaymentInitializedRes.data.authorization_url,
          amount: payload.amount,
          reference: paystackPaymentInitializedRes.data.reference
        }
      });
    }); */

    it('should handle payment initialization error and return appropriate response', async () => {
      await createStudentTest(factory);
      mockAxios.onPost(`${PAYSTACK_BASE_URL}/transaction/initialize`).reply(500, {
        message: 'Error initializing payment'
      });

      const { mockedResponse } = await initializePaymentAndGetResponse();

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_GATEWAY.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment could not be initialized. Please try again later'
      });
    });

    it('should handle non-Axios errors and return 500 status code', async () => {
      await createStudentTest(factory);
      mockAxios.onPost(`${PAYSTACK_BASE_URL}/transaction/initialize`).networkError();

      // Inject a non-Axios error by throwing an exception
      const nonAxiosError = new Error('Server error');
      jest.spyOn(axios, 'post').mockReturnValue(Promise.reject(nonAxiosError));

      const { mockedResponse } = await initializePaymentAndGetResponse();

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message
      });
    });
  });

  describe('GET /verify/:reference', () => {
    const factory: TestFactory = new TestFactory();
    const mockAxios = new MockAdapter(axios);
    const mockedRequest = {
      params: {
        reference: 'test_reference'
      },
      jwtPayload: {
        userId: 1,
        email: testStudent.email
      }
    } as any;

    const mockedResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as any;

    const paystackPaymentVerifiedRes = {
      status: true,
      message: 'Verification successful',
      data: {
        id: 1,
        status: 'success',
        reference: 'test_reference',
        amount: 20_000,
        paid_at: '2023-07-01T00:00:00.000Z'
      }
    };

    beforeEach((done) => {
      factory.init().then(done);
      mockAxios.reset();
    });

    afterEach((done) => {
      factory.close().then(done);
      mockAxios.reset();
    });

    /* it('should verify payment successfully and return appropriate response', async () => {
      await createStudentTest(factory);
      mockAxios
        .onGet(`${PAYSTACK_BASE_URL}/transaction/verify/${mockedRequest.params.reference}`)
        .reply(HTTP_STATUS.OK.code, paystackPaymentVerifiedRes);

      mockAxios
        .onPost(`${PAYSTACK_BASE_URL}/transaction/initialize`)
        .reply(HTTP_STATUS.OK.code, paystackPaymentInitializedRes);

      const { mockedResponse: initializationResponse } = await initializePaymentAndGetResponse();
      expect(initializationResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK.code);

      await verifyPayment(mockedRequest, mockedResponse);

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment verified successfully',
        paidAt: new Date(paystackPaymentVerifiedRes.data.paid_at)
      });
    }); */

    it('should return a 404 error if payment with given reference is not found', async () => {
      mockAxios
        .onGet(`${PAYSTACK_BASE_URL}/transaction/verify/${mockedRequest.params.reference}`)
        .reply(200, paystackPaymentVerifiedRes);

      await verifyPayment(mockedRequest, mockedResponse);

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment not found'
      });
    });

    /* it('should return a 400 error if payment verification is not successful', async () => {
      await createStudentTest(factory);
      mockAxios
        .onGet(`${PAYSTACK_BASE_URL}/transaction/verify/${mockedRequest.params.reference}`)
        .reply(200, {
          status: true,
          message: 'Verification failed',
          data: {
            id: 1,
            status: 'failed',
            reference: 'test_reference'
          }
        });

      mockAxios
        .onPost(`${PAYSTACK_BASE_URL}/transaction/initialize`)
        .reply(HTTP_STATUS.OK.code, paystackPaymentInitializedRes);

      const { mockedResponse: initializationResponse } = await initializePaymentAndGetResponse();
      expect(initializationResponse.status).toHaveBeenCalledWith(HTTP_STATUS.OK.code);

      await verifyPayment(mockedRequest, mockedResponse);

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment was not successful'
      });
    }); */

    it('it should handle axios errors and return appropriate response', async () => {
      await createStudentTest(factory);
      mockAxios
        .onGet(`${PAYSTACK_BASE_URL}/transaction/verify/${mockedRequest.params.reference}`)
        .reply(HTTP_STATUS.INTERNAL_SERVER_ERROR.code, {
          message: 'Error initializing payment'
        });

      // Call the controller function with the mocked req and res objects
      await verifyPayment(mockedRequest, mockedResponse);

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_GATEWAY.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: 'Payment could not be verified. Please try again later'
      });
    });

    it('should handle non-Axios errors and return 500 status code', async () => {
      await createStudentTest(factory);
      mockAxios
        .onGet(`${PAYSTACK_BASE_URL}/transaction/verify/${mockedRequest.params.reference}`)
        .networkError();

      // Inject a non-Axios error by throwing an exception
      const nonAxiosError = new Error('Server error');
      jest.spyOn(axios, 'get').mockReturnValue(nonAxiosError as any);

      await verifyPayment(mockedRequest, mockedResponse);

      expect(mockedResponse.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR.code);
      expect(mockedResponse.send).toHaveBeenCalledWith({
        message: HTTP_STATUS.INTERNAL_SERVER_ERROR.message
      });
    });
  });

  describe('GET /balance', () => {
    const factory: TestFactory = new TestFactory();
    const balanceRoute = '/payment/balance';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it("should return student's balance", async () => {
      await createStudentTest(factory);
      const res = await factory.app
        .get(balanceRoute)
        .set('authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(res.body).toStrictEqual({
        balance: expect.any(Number),
        currency: expect.any(String)
      });
    });

    it('should return error when user is not logged in', async () => {
      const res = await factory.app.get(balanceRoute);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe(authorizationHeaderError);
    });
  });

  describe('GET /account-statement', () => {
    const factory: TestFactory = new TestFactory();
    const accountStatementRoute = '/payment/account-statement';

    beforeEach((done) => {
      factory.init().then(done);
    });

    afterEach((done) => {
      factory.close().then(done);
    });

    it('should return student account statement', async () => {
      await createStudentTest(factory);
      const res = await factory.app
        .get(accountStatementRoute)
        .set('authorization', `Bearer ${generateStudentAuthToken()}`);
      expect(res.status).toBe(HTTP_STATUS.OK.code);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should return error when student is not logged in', async () => {
      const res = await factory.app.get(accountStatementRoute);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED.code);
      expect(res.body.message).toBe(authorizationHeaderError);
    });
  });
});
