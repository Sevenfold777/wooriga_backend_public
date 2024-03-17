import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class UserInquiry extends BaseEntity {
  @Column()
  title: string;

  @Column()
  payload: string;

  @Column({ default: false })
  isReplied: boolean;

  @Column({ nullable: true })
  reply?: string;

  @Column({ nullable: true })
  replyDate?: Date;

  @ManyToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  author: User;
}
