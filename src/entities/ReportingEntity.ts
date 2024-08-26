import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { ReportMessages } from './ReportMessagesEntity';
import { StaffEntity } from './StaffEntity';
import { StudentEntity } from './StudentEntity';
import { SupportTicketStatus } from './types';

@Entity()
export class ReportingEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ unique: true, nullable: true })
    ticketNo: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ default: true, nullable: true })
    isReadByStudent: boolean;

    @Column({ type: 'text', nullable: true })
    snippet: string;

    @Column({ type: 'enum', enum: SupportTicketStatus, default: SupportTicketStatus.OPEN })
    status: SupportTicketStatus;

    @OneToMany(() => ReportMessages, (message) => message.report, { cascade: true, onDelete: 'CASCADE' })
    messages: ReportMessages[];

    @ManyToOne(() => StaffEntity, (admin) => admin.reports, { nullable: true })
    admin: StaffEntity;

    @ManyToOne(() => StudentEntity, (student) => student.reports, { nullable: true, onDelete: 'CASCADE' })
    student: StudentEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
