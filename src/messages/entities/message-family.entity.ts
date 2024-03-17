import { BaseEntity } from 'src/common/entities/base.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { MessageFamilyMetoo } from './message-family-metoo.entity';
import { MessageFamilyComment } from './message-family-comment.entity';
import { Message } from './message.entity';
import { User } from 'src/users/entities/user.entity';
import { MessageFamilyKeep } from './message-family-keep.entity';

@Entity()
export class MessageFamily extends BaseEntity {
  @Column()
  receiveDate: Date;

  @ManyToOne(() => Message, (message) => message.messageFamily, {
    eager: true,
    onDelete: 'CASCADE',
  })
  message: Message;

  @ManyToOne(() => Family, (family) => family.messageFamily, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  family: Family;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  sender: User;

  @OneToMany(() => MessageFamilyComment, (comment) => comment.message)
  comments: MessageFamilyComment[];

  @OneToMany(() => MessageFamilyMetoo, (metoo) => metoo.message)
  metoos: MessageFamilyMetoo[];

  @OneToMany(() => MessageFamilyKeep, (keep) => keep.message)
  keeps: MessageFamilyKeep[];
}
