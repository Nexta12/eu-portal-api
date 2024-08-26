import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AcademicsEntity } from './AcademicsEntity';
import { BillEntity } from './BillEntity';
import { CourseEntity } from './CourseEntity';

@Entity({ name: 'semester_courses' })
export class SemesterCourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ default: false })
  isEnrolled: boolean;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => AcademicsEntity, course => course.semesterCourses, { onDelete: 'CASCADE' })
  academicSession: AcademicsEntity;

  @ManyToOne(() => CourseEntity, course => course.semesterCourses, { onDelete: 'CASCADE' })
  course: CourseEntity;

  @OneToOne(() => BillEntity, (bill) => bill.semesterCourse, { nullable: true})
  bill: BillEntity
}
