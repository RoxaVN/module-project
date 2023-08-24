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
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column('text')
  type: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column('text')
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Relation<Task>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdDate: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedDate: Date;
}
