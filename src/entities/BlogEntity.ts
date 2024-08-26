import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { StaffEntity } from './StaffEntity'; // Assuming you have a StaffEntity for the author
import { CategoryEntity } from './CategoryEntity';


@Entity({ name: 'blogs' })
export class BlogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    blogImage: string;

    @Column({ type: 'varchar', nullable: true })
    snippet: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => StaffEntity, (author) => author.posts)
    @JoinColumn({ name: 'authorId' })
    author: StaffEntity;

    @ManyToOne(() => CategoryEntity, category => category.blogs, { nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: CategoryEntity;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

}
