import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AcademicsEntity } from './AcademicsEntity';
import { SemesterCourseEntity } from './SemesterCourseEntity';
import { StudentEntity } from './StudentEntity';
import { BillType } from './types';

@Entity({ name: 'bills' })
export class BillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: BillType, default: BillType.APPLICATION_FEE })
  type: BillType;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0})
  amountUsd: number;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  referenceNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => StudentEntity, student => student.userId, { onDelete: 'CASCADE' })
  student: StudentEntity;

  @ManyToOne(() => AcademicsEntity, academicSession => academicSession.bills, { nullable: true })
  academicSession: AcademicsEntity;

  @OneToOne(() => SemesterCourseEntity, { nullable: true })
  @JoinColumn()
  semesterCourse: SemesterCourseEntity;
}
