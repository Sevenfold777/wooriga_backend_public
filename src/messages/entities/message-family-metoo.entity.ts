import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { MessageFamily } from './message-family.entity';

@Entity()
export class MessageFamilyMetoo extends BaseEntity {
  @ManyToOne(() => User, (user) => user.messageFamilyMetoo, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => MessageFamily, (message) => message.metoos, {
    onDelete: 'CASCADE',
  })
  message: MessageFamily;
}
