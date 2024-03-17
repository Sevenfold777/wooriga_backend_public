import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Banner, BannerType } from './entities/banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private bannerRepository: Repository<Banner>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  findBannersHome(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { type: BannerType.HOME },
    });
  }

  // output dto: order 추가해야
  async findBannersBar(screen: string): Promise<Banner[]> {
    const rawQuery = await this.dataSource.query(`
      select B.id, B.createdAt, B.updatedAt, B.url, B.type, B.payloadType, B.payloadPath, B.description, P.order 
      from banner as B
      inner join (select * from banner_payload_placement
            where banner_payload_placement.screen = '${screen}') as P on P.bannerId = B.id
      where B.type = "bar"
      order by P.order asc, B.updatedAt desc, B.id desc;    
    `);

    return rawQuery;
  }
}
