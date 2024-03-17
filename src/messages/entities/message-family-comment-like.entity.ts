import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { MessageFamilyComment } from './message-family-comment.entity';

@Entity()
export class MessageFamilyCommentLike extends BaseEntity {
  @ManyToOne(() => MessageFamilyComment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  comment: MessageFamilyComment;

  @ManyToOne(() => User, (user) => user.likeMessageFamComments, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;
}
