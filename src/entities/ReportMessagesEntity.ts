import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ReportingEntity } from './ReportingEntity';
import { StaffEntity } from './StaffEntity';
import { StudentEntity } from './StudentEntity';

@Entity()
export class ReportMessages {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    reportId: string;

    @ManyToOne(() => ReportingEntity, (report) => report.messages, { onDelete: 'CASCADE' })
    report: ReportingEntity;

    @ManyToOne(() => StaffEntity, (admin) => admin.messages, { nullable: true })
    admin: StaffEntity;

    @ManyToOne(() => StudentEntity, (student) => student.messages, { nullable: true, onDelete: 'CASCADE' })
    student: StudentEntity;

    @CreateDateColumn()
    createdAt: Date;
}
