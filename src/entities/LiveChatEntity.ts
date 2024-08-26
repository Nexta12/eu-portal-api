import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { ChatUserEntity } from './ChatUsersEntity';
import { ChatMessageEntity } from './ChatMessagesEntity';



@Entity('live_chats')
export class LiveChatEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @OneToOne(() => ChatUserEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    chatUser: ChatUserEntity;

    @OneToMany(() => ChatMessageEntity, message => message.liveChat, { cascade: true, onDelete: 'CASCADE' })
    messages: ChatMessageEntity[];

    @CreateDateColumn()
    createdAt: Date;

}
