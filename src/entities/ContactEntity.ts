import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ContactEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    firstName: string;

    @Column({ type: 'text' })
    lastName: string;

    @Column({ type: 'text', unique: true, nullable: true })
    email?: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ type: 'text', nullable: true })
    reply: string;

    @Column({ type: 'text', nullable: true })
    snippet?: string;

    @CreateDateColumn()
    createdAt: Date;
}
