import { Entity, PrimaryGeneratedColumn, Column,CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StaffEntity } from './StaffEntity';

@Entity({ name: 'events' })
export class EventEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 20,  nullable: true})
    focus: string;

    @Column({ type: 'text' })
    description: string;

    @ManyToOne(() => StaffEntity, (author) => author.events)
    @JoinColumn({ name: 'authorId' })
    author: StaffEntity;

    @Column({ nullable: true })
    eventDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
