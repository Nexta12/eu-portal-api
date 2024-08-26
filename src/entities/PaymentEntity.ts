import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentEntity } from './StudentEntity';
import { Currency, PaymentChannel, PaymentStatus } from './types';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.NGN})
  currency: Currency;

  @Column()
  accessCode: string;

  @Column({ type: 'enum', enum: PaymentChannel, default: PaymentChannel.PAYSTACK})
  channel: PaymentChannel;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING})
  status: PaymentStatus;

  @Column({ nullable: true })
  paidAt: Date;

  @Column()
  description: string;

  @ManyToOne(() => StudentEntity, student => student.payments, { onDelete: 'CASCADE' })
  student: StudentEntity;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;
}
