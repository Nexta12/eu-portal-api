export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
  CHAT = 'chat'
}

export enum Cohort {
  CERTIFICATE = 'certificate',
  DIPLOMA = 'diploma',
  DEGREE = 'degree',
  POSTGRADUATE = 'postgraduate'
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  UNEMPLOYED = 'unemployed',
  SELF_EMPLOYED = 'self-employed'
}

export enum AdmissionStatus {
  APPLICATION = 'application',
  APPLICATION_FEE_PAID = 'application_fee_paid',
  IN_REVIEW = 'in_review',
  ADMITTED = 'admitted',
  REJECTED = 'rejected'
}

export enum Level {
  ONE_HUNDRED_LEVEL = '100L',
  TWO_HUNDRED_LEVEL = '200L',
  THREE_HUNDRED_LEVEL = '300L',
  FOUR_HUNDRED_LEVEL = '400L',
  FIVE_HUNDRED_LEVEL = '500L'
}

export enum PaymentChannel {
  PAYSTACK = 'paystack'
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD'
}

export enum BillType {
  APPLICATION_FEE = 'Application Fee',
  TUITION = 'Tuition Fee',
  ICT_LEVY = 'ICT Levy',
  EXCURSION_LEVY = 'Excursion Levy',
  COURSE_REGISTRATION = 'Course Registration Fee'
}

export enum Semester {
  FIRST = 'first',
  SECOND = 'second'
}

export enum AcademicsStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum ProcessAdmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
export enum SupportTicketStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  AWAITING_STUDENT_REPLY = 'ASR',
  AWAITING_ADMIN_REPLY = 'ADR'
}

