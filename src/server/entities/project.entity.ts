import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Task } from './task.entity.js';

@Entity()
export class Project {
  static TYPE_DEFAULT = 'default';

  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column('text', { default: Project.TYPE_DEFAULT })
  type: string;

  @Column('bool', { default: false })
  isPublic: boolean;

  @Index()
  @Column('uuid')
  userId: string;

  @Column('text')
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Relation<Task>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedDate: Date;
}
