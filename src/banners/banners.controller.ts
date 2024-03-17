import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';

@Public()
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}
  @Get('home')
  findBannersHome(): Promise<Banner[]> {
    return this.bannersService.findBannersHome();
  }

  @Get('bar')
  findBannersBar(@Query('screen') screen: string): Promise<Banner[]> {
    return this.bannersService.findBannersBar(screen);
  }
}
