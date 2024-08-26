import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourseEntity } from './CourseEntity';
import { FacultyEntity } from './FacultyEntity';
import { StudentEntity } from './StudentEntity';

@Entity({ name: 'programmes' })
export class ProgrammeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true})
  name: string;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column({type: 'text', nullable: true})
  entryRequirements: string;

  @Column({type: 'text', nullable: true})
  objectives: string;

  @Column({type: 'text', nullable: true})
  overview: string;

  @Column()
  durationInMonths: number;

  @Column({ default: false})
  isCertificate: boolean;

  @Column({ default: false})
  isDiploma: boolean;

  @Column({ default: false})
  isDegree: boolean;

  @Column({default: false})
  isPostgraduate: boolean;

  @ManyToOne(() => FacultyEntity, (faculty) => faculty.programmes)
  faculty: FacultyEntity;

  @OneToMany(() => StudentEntity, (student) => student.programme)
  students: StudentEntity[];

  @OneToMany(() => CourseEntity, (course) => course.programme)
  courses: CourseEntity[];
}
