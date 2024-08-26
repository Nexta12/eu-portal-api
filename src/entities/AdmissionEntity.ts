import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StaffEntity } from './StaffEntity';
import { StudentEntity } from './StudentEntity';
import { ProcessAdmissionStatus } from './types';

@Entity({ name: 'admissions' })
export class AdmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ProcessAdmissionStatus})
  status: ProcessAdmissionStatus;

  @Column()
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  admissionLetter: string;

  @ManyToOne(() => StudentEntity, (student) => student.admissions, { onDelete: 'CASCADE' })
  student: StudentEntity;

  @ManyToOne(() => StaffEntity, (staff) => staff.admissions)
  processedBy: StaffEntity;
}
