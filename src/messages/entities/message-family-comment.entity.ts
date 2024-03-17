import { Comment } from 'src/common/entities/comment.entity';
import { Entity, ManyToOne, OneToMany } from 'typeorm';
import { MessageFamilyCommentLike } from './message-family-comment-like.entity';
import { MessageFamily } from './message-family.entity';

@Entity()
export class MessageFamilyComment extends Comment {
  @ManyToOne(() => MessageFamily, (message) => message.comments, {
    onDelete: 'CASCADE',
  })
  message: MessageFamily;

  @OneToMany(() => MessageFamilyCommentLike, (like) => like.comment, {
    eager: true,
  })
  likes: MessageFamilyCommentLike[];
}
