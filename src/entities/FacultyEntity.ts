import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProgrammeEntity } from './ProgrammeEntity';
import { StaffEntity } from './StaffEntity';

@Entity({ name: 'faculties' })
export class FacultyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ProgrammeEntity, (programme) => programme.faculty)
  programmes: ProgrammeEntity[];

  @ManyToOne(() => StaffEntity, (staff) => staff.userId)
  createdBy: StaffEntity;
}
