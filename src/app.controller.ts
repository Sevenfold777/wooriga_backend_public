import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Get()
  init(): string {
    return 'This is Family-Project API v1.0';
  }

  @Public()
  @Get('healthCheck')
  healthCheck(): void {
    return;
  }
}
