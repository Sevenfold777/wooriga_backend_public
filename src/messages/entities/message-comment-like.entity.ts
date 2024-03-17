import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { MessageComment } from './message-comment.entity';

@Entity()
export class MessageCommentLike extends BaseEntity {
  @ManyToOne(() => MessageComment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  comment: MessageComment;

  @ManyToOne(() => User, (user) => user.likeMessageComments, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;
}
