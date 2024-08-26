import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StudentEntity } from './StudentEntity';

type Document = {
  format: string;
  createdAt: Date;
  bytes: number;
  url: string;
}

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'jsonb', nullable: true})
  docs: Document[];

  @OneToOne(() => StudentEntity, student => student.document, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentEntity;
}
