import { BaseEntity } from 'src/common/entities/base.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { PhotoComment } from './photo-comment.entity';
import { PhotoLike } from './photo-like.entity';
import { PhotoFile } from './photoFile.entity';
import { Theme } from './theme.entity';

@Entity()
export class Photo extends BaseEntity {
  @Column()
  theme: string;
  // 일단 string으로, 별도의 서버에서 콜렉팅 --> Theme Entity 추가
  // Theme Entity로 photo.theme 추천 api 만들어야

  @OneToMany(() => PhotoFile, (files) => files.photo)
  files: PhotoFile[];

  @Column({ nullable: true, length: 700 })
  payload: string;

  @ManyToOne(() => User, (user) => user.photos, { onDelete: 'CASCADE' })
  author: User;

  @ManyToOne(() => Family, (family) => family.photos, {
    onDelete: 'CASCADE',
  })
  family: Family;

  @OneToMany(() => PhotoComment, (comment) => comment.photo)
  comments: PhotoComment[];

  @OneToMany(() => PhotoLike, (like) => like.photo)
  likes: PhotoLike[];
}
