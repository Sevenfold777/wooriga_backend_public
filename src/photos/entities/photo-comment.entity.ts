import { Comment } from 'src/common/entities/comment.entity';
import { Entity, ManyToOne, OneToMany } from 'typeorm';
import { PhotoCommentLike } from './photo-comment-like.entity';
import { Photo } from './photo.entity';

@Entity()
export class PhotoComment extends Comment {
  @ManyToOne(() => Photo, { createForeignKeyConstraints: false })
  photo: Photo;

  @OneToMany(() => PhotoCommentLike, (like) => like.comment, {
    eager: true,
  })
  likes: PhotoCommentLike[];
}
