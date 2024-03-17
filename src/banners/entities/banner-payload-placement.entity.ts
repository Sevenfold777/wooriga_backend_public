import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Banner } from './banner.entity';

@Entity()
export class BannerPayloadPlacement extends BaseEntity {
  @Column()
  screen: string;

  @Column()
  order: string;

  @ManyToOne(() => Banner, (banner) => banner.placement, {
    onDelete: 'CASCADE',
  })
  banner: Banner;
}
