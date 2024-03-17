import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { PhotoComment } from './photo-comment.entity';

@Entity()
export class PhotoCommentLike extends BaseEntity {
  @ManyToOne(() => PhotoComment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  comment: PhotoComment;

  @ManyToOne(() => User, (user) => user.likePhotoComments, { eager: true })
  user: User;
}
