import { BaseEntity } from 'src/common/entities/base.entity';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { MessageComment } from './message-comment.entity';
import { MessageFamily } from './message-family.entity';
import { MessageKeep } from './message-keep.entity';
import { MessageMetoo } from './message-metoo.entity';

export enum ServiceLinked {
  NONE = 'none',
  LETTER = 'letter',
  PHOTO = 'photo',
  PEDIA = 'pedia',
}

@Entity()
export class Message extends BaseEntity {
  @Column({ length: 350 })
  payload: string;

  @Column()
  emotion: DailyEmotions;

  @Column()
  uploadAt: Date;

  @ManyToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  author: User;

  @OneToMany(() => MessageFamily, (messageFamily) => messageFamily.message)
  messageFamily: MessageFamily[];

  @OneToMany(() => MessageComment, (comment) => comment.message)
  comments: MessageComment[];

  // @OneToMany(() => Voice, (voice) => voice.message)
  // voices: Voice[];

  @OneToMany(() => MessageMetoo, (metoo) => metoo.message)
  metoos: MessageMetoo[];

  @OneToMany(() => MessageKeep, (keep) => keep.message)
  keeps: MessageKeep[];

  @Column({ nullable: true })
  commentDecorator: string;

  @Column({ default: ServiceLinked.NONE })
  linkTo: ServiceLinked;
}
