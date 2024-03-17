import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class MessageMetoo extends BaseEntity {
  @ManyToOne(() => User, (user) => user.messageMetoo, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Message, (message) => message.metoos, {
    onDelete: 'CASCADE',
  })
  message: Message;
}
