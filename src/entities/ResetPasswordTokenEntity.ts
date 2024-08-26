import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentEntity } from './StudentEntity';

@Entity({ name: 'reset_password_tokens'})
export class ResetPasswordTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => StudentEntity, user => user.resetPasswordTokens)
  userId: StudentEntity;
}
