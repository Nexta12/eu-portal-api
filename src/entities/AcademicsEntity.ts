import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BillEntity } from './BillEntity';
import { SemesterCourseEntity } from './SemesterCourseEntity';
import { StudentEntity } from './StudentEntity';
import { AcademicsStatus, Level, Semester } from './types';

@Entity({ name: 'academics' })
export class AcademicsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: Level, type: 'enum', default: Level.ONE_HUNDRED_LEVEL })
  level: Level;

  @Column({ enum: Semester, type: 'enum', default: Semester.FIRST })
  semester: Semester;

  @Column({ nullable: true })
  gpa: number;

  @Column({ nullable: true })
  session: string;

  @Column({ enum: AcademicsStatus, type: 'enum', default: AcademicsStatus.IN_PROGRESS })
  status: AcademicsStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => StudentEntity, student => student.academics, { onDelete: 'CASCADE' })
  student: StudentEntity;

  @OneToMany(() => BillEntity, student => student.academicSession, { onDelete: 'CASCADE' })
  bills: BillEntity[];

  @OneToMany(() => SemesterCourseEntity, semesterCourse => semesterCourse.academicSession, { onDelete: 'CASCADE' })
  semesterCourses: SemesterCourseEntity[];
}
