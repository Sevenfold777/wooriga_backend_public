import { BaseEntity } from 'src/common/entities/base.entity';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
export class Family extends BaseEntity {
  @OneToMany(() => User, (user) => user.family)
  users: User[];

  @OneToMany(() => MessageFamily, (messageFamily) => messageFamily.family)
  messageFamily: MessageFamily[];

  @OneToMany(() => Photo, (photo) => photo.family)
  photos: Photo[];
}
