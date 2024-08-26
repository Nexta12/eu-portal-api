import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StaffEntity } from './StaffEntity';



@Entity()
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column()
    level: string;

    @ManyToOne(() => StaffEntity, (author) => author.notifications)
    @JoinColumn({ name: 'authorId' })
    author: StaffEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
