import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';
import { Photo } from './photo.entity';

@Entity()
export class PhotoLike extends BaseEntity {
  @ManyToOne(() => Photo, (photo) => photo.likes, {
    onDelete: 'CASCADE',
  })
  photo: Photo;

  @ManyToOne(() => User, (user) => user.likePhotos, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;
}
