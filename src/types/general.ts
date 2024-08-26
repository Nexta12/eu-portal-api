import { UserRole } from '../entities';

export type Role = Lowercase<keyof typeof UserRole>;

export type SemesterCourseType = {
  semesterCourseId: number;
  name: string;
  code: string;
  description: string;
  unit: number;
  costUsd: number;
  isCompulsory: boolean;
  isPaid: boolean;
  isEnrolled: boolean;
  isCompleted: boolean;
};
