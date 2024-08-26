import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Gender } from '../types';

export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({unique: true})
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE})
  gender: Gender;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({nullable: true})
  address: string;

  @Column({ nullable: true })
  isPasswordGenerated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
