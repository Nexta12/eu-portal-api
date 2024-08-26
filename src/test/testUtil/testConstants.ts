import { UserRole } from '../../entities';

export const testStudent = {
  firstName: 'Test',
  lastName: 'Student',
  email: 'student@test.com',
  country: 'Nigeria',
  phoneNumber: '0702222222',
  password: 'pass12345',
  cohort: 'degree',
  gender: 'male',
  role: UserRole.STUDENT
};

export const testStaff = {
  firstName: 'staff',
  lastName: 'staff',
  email: 'staff@test.com',
  password: 'staff123',
  role: UserRole.STAFF,
  gender: 'male',
  phoneNumber: '111222333',
  address: 'House drive 24',
  dateOfEmployment: '2022-10-24',
  cityOfResidence: 'TestCity',
  designation: 'Tester'
};

export const testAdmin = {
  firstName: 'admin',
  lastName: 'admin',
  email: 'admin@test.com',
  password: 'admin123',
  role: UserRole.ADMIN,
  gender: 'male',
  phoneNumber: '111222333',
  address: 'House drive 24',
  dateOfEmployment: '2022-10-24',
  cityOfResidence: 'TestCity',
  designation: 'Tester'
};

export const testProgramme = {
  name: 'Computer Science',
  durationInMonths: 24
};

export const testFaculty = { name: 'Engineering' };

export const testCourse = {
  name: 'test course',
  code: 'TEST1234',
  description: 'test course description',
  unit: 3,
  costUsd: 4,
  isCompulsory: true,
  semester: 'first',
  level: '100L',
  cohort: 'degree'
};

export const authorizationHeaderError = 'Authorization header not provided';
export const randomUuid = '964e01e4-2aab-4cdf-838d-50dba5f5ae0f';
