import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { BannerPayloadPlacement } from './banner-payload-placement.entity';

@Entity()
export class Banner extends BaseEntity {
  @Column()
  url: string;

  @Column()
  type: BannerType;

  @Column({ nullable: true })
  description: string;

  @Column()
  payloadType: BannerPayloadType;

  @Column()
  payloadPath: string;

  @OneToMany(() => BannerPayloadPlacement, (place) => place.banner, {
    eager: true,
  })
  placement: BannerPayloadPlacement;
}

export enum BannerType {
  HOME = 'home',
  BAR = 'bar',
}

export enum BannerPayloadType {
  WEBVIEW = 'webview',
  SCREEN = 'screen',
}
