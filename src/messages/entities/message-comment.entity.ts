import { Comment } from 'src/common/entities/comment.entity';
import { Entity, ManyToOne, OneToMany } from 'typeorm';
import { MessageCommentLike } from './message-comment-like.entity';
import { Message } from './message.entity';

@Entity()
export class MessageComment extends Comment {
  @ManyToOne(() => Message, (message) => message.comments, {
    onDelete: 'CASCADE',
  })
  message: Message;

  @OneToMany(() => MessageCommentLike, (like) => like.comment, {
    eager: true,
  })
  likes: MessageCommentLike[];
}
