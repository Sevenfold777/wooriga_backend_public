import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class MessageKeep extends BaseEntity {
  @ManyToOne(() => User, (user) => user.messageKeep, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Message, (message) => message.keeps, {
    onDelete: 'CASCADE',
  })
  message: Message;
}
