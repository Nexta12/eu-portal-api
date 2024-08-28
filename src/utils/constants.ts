import { BillType } from '../entities';

export const HTTP_STATUS = {
  OK: { code: 200, message: 'OK' },
  CREATED: { code: 201, message: 'Created' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'You are not authorized to perform this action' },
  NOT_FOUND: { code: 404, message: 'Not Found' },
  CONFLICT: { code: 409, message: 'Conflict' },
  PAYMENT_REQUIRED: { code: 402, message: 'Payment Required' },
  UNPROCESSABLE_ENTITY: { code: 422, message: 'Unprocessable Entity' },
  INTERNAL_SERVER_ERROR: { code: 500, message: 'Internal Server Error' },
  BAD_GATEWAY: { code: 502, message: 'Bad Gateway' }
};

export const MINIMUM_PASSWORD_LENGTH = 6;
export const PAYSTACK_BASE_URL = 'https://api.paystack.co';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const BCRYPT_SALT_ROUNDS = 10;
export const EMAIL_FROM = 'info@euniversityedu.africa';

// Make sure frontend and backend have the same value for DOLLAR_TO_NAIRA rate
export const DOLLAR_TO_NAIRA = 800;

export const semesterRegistrationPayments = [
  {
    type: BillType.TUITION,
    description: 'New semester tuition fee',
    amountUsd: 50
  },
  {
    type: BillType.ICT_LEVY,
    description: 'New semester ICT levy',
    amountUsd: 20
  },
  {
    type: BillType.EXCURSION_LEVY,
    description: 'New semester excursion levy',
    amountUsd: 5
  }
];
