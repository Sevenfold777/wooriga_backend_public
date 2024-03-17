import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Photo } from './photo.entity';

@Entity()
export class PhotoFile extends BaseEntity {
  @Column()
  url: string;

  @Column()
  width: number;

  @Column()
  height: number;

  @ManyToOne(() => Photo, (photo) => photo.files, { onDelete: 'CASCADE' })
  photo: Photo;
}
