import { Column, Entity, OneToMany } from 'typeorm';
import { AdmissionEntity } from './AdmissionEntity';
import { User } from './base/User';
import { CourseEntity } from './CourseEntity';
import { UserRole } from './types';
import { BlogEntity } from './BlogEntity';
import { NotificationEntity } from './NotificationEntity';
import { ReportingEntity } from './ReportingEntity';
import { ReportMessages } from './ReportMessagesEntity';
import { EventEntity } from './EventEntity';
import { ChatMessageEntity } from './ChatMessagesEntity';


@Entity({ name: 'staffs' })
export class StaffEntity extends User {
  @Column({ default: UserRole.STAFF, type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  dateOfEmployment: Date;

  @Column({ nullable: true })
  cityOfResidence: string;

  @Column({ nullable: true })
  designation: string;

  @OneToMany(() => CourseEntity, course => course.facilitator)
  courses: CourseEntity[];

  @OneToMany(() => AdmissionEntity, admission => admission.processedBy)
  admissions: AdmissionEntity[];

  @OneToMany(() => BlogEntity, post => post.author)
  posts: BlogEntity[]

  @OneToMany(() => NotificationEntity, notification => notification.author)
  notifications: NotificationEntity[];

  @OneToMany(() => EventEntity, event => event.author)
  events: EventEntity[];

  @OneToMany(() => ReportingEntity, (report) => report.admin)
  reports: ReportingEntity[];

  @OneToMany(() => ReportMessages, (message) => message.admin)
  messages: ReportMessages[];

  @OneToMany(() => ChatMessageEntity, message => message.staff)
  chats: ChatMessageEntity[];

}
