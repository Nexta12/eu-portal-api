import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { ProgrammeEntity } from './ProgrammeEntity';
import { SemesterCourseEntity } from './SemesterCourseEntity';
import { StaffEntity } from './StaffEntity';
import { Cohort, Level, Semester } from './types';

@Entity({ name: 'courses' })
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column()
  unit: number;

  @Column()
  costUsd: number;

  @Column({ type: 'enum', enum: Semester, default: Semester.FIRST })
  semester: Semester;

  @Column({ default: false })
  isCompulsory: boolean;

  @Column({ enum: Level, type: 'enum', default: Level.ONE_HUNDRED_LEVEL })
  level: Level;

  @Column({ enum: Cohort, type: 'enum', default: Cohort.CERTIFICATE })
  cohort: Cohort;

  @ManyToOne(() => ProgrammeEntity, programme => programme.courses)
  programme: ProgrammeEntity;

  @ManyToOne(() => StaffEntity, staff => staff.courses)
  facilitator: StaffEntity;

  @OneToMany(() => SemesterCourseEntity, semesterCourse => semesterCourse.course)
  semesterCourses: SemesterCourseEntity[];
}
