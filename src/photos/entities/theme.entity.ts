import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Photo } from './photo.entity';

@Entity()
export class Theme {
  @PrimaryColumn()
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastShowedAt: Date;

  @Column({ default: 0 })
  totalShowedCnt: number;
}
