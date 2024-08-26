import { Entity, Column, OneToOne, OneToMany, ManyToOne } from 'typeorm';
import { AcademicsEntity } from './AcademicsEntity';
import { AdmissionEntity } from './AdmissionEntity';
import { User } from './base/User';
import { DocumentEntity } from './DocumentEntity';
import { PaymentEntity } from './PaymentEntity';
import { BillEntity } from './BillEntity';
import { ProgrammeEntity } from './ProgrammeEntity';
import { ResetPasswordTokenEntity } from './ResetPasswordTokenEntity';
import { AdmissionStatus, Cohort, EmploymentStatus, Level, UserRole } from './types';
import { NotificationEntity } from './NotificationEntity';
import { ReportMessages } from './ReportMessagesEntity';
import { ReportingEntity} from './ReportingEntity';

@Entity({ name: 'students' })
export class StudentEntity extends User {
  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({ default: UserRole.STUDENT, type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  matriculationNumber: string;

  @Column({ default: 'Nigeria', nullable: true })
  country: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ enum: Level, type: 'enum', nullable: true })
  level: Level;

  @Column({ enum: Cohort, type: 'enum', default: Cohort.CERTIFICATE })
  cohort: Cohort;

  @ManyToOne(() => ProgrammeEntity, programme => programme.students)
  programme: ProgrammeEntity;

  @OneToOne(() => DocumentEntity, document => document.student)
  document: DocumentEntity;

  @Column({ default: EmploymentStatus.UNEMPLOYED, type: 'enum', enum: EmploymentStatus })
  employmentStatus: EmploymentStatus;

  @Column({ default: AdmissionStatus.APPLICATION, type: 'enum', enum: AdmissionStatus })
  admissionStatus: AdmissionStatus;

  @OneToMany(() => PaymentEntity, payment => payment.student, { onDelete: 'CASCADE' })
  payments: PaymentEntity[];

  @OneToMany(() => BillEntity, payment => payment.student, { onDelete: 'CASCADE' })
  bills: BillEntity[];

  @OneToMany(() => AcademicsEntity, academics => academics.student, { onDelete: 'CASCADE' })
  academics: AcademicsEntity[];

  @OneToMany(() => ResetPasswordTokenEntity, resetPasswordToken => resetPasswordToken.userId)
  resetPasswordTokens: ResetPasswordTokenEntity[];

  @OneToMany(() => AdmissionEntity, admission => admission.student, { onDelete: 'CASCADE' })
  admissions: AdmissionEntity[];

  @OneToMany(() => NotificationEntity, notification => notification.author)
  notifications: NotificationEntity[];
 
  @OneToMany(() => ReportingEntity, (report) => report.student)
  reports: ReportingEntity[];

  @OneToMany(() => ReportMessages, (message) => message.student)
  messages: ReportMessages[];

}
