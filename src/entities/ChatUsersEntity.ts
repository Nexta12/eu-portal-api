import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './types';
import { LiveChatEntity } from './LiveChatEntity';
import { ChatMessageEntity } from './ChatMessagesEntity';


@Entity('chat_users')
export class ChatUserEntity {
    @PrimaryGeneratedColumn('uuid')
    userId: string;

    @Column({ default: UserRole.CHAT, type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ nullable: true })
    name: string;

    @Column({ unique: true })
    email: string;

    @OneToOne(() => LiveChatEntity, liveChat => liveChat.chatUser, { cascade: true, onDelete: 'CASCADE' } )
    liveChat: LiveChatEntity;

    @OneToMany(() => ChatMessageEntity, message => message.chatuser, { cascade: true, onDelete: 'CASCADE' })
    messages: ChatMessageEntity;
}
