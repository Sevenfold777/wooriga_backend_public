import { User } from 'src/users/entities/user.entity';
import { Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum Status {
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  ACTIVE = 'active',
}

export class Comment extends BaseEntity {
  @Column()
  payload: string;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
    // createForeignKeyConstraints: false,
  })
  author: User;

  @Column({ default: Status.ACTIVE })
  status: Status;
}
