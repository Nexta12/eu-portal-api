import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { LiveChatEntity } from './LiveChatEntity';
import { StaffEntity } from './StaffEntity';
import { ChatUserEntity } from './ChatUsersEntity';

@Entity('chat_messages')
export class ChatMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    chatId: string;

    @ManyToOne(() => LiveChatEntity, liveChat => liveChat.messages, { onDelete: 'CASCADE' })
    liveChat: LiveChatEntity;

    @ManyToOne(() => StaffEntity, staff => staff.messages, { onDelete: 'CASCADE' })
    staff: StaffEntity;

    @ManyToOne(() => ChatUserEntity, chatuser => chatuser.messages,  { onDelete: 'CASCADE' })
    chatuser: ChatUserEntity;

    @CreateDateColumn()
    createdAt: Date;
}
