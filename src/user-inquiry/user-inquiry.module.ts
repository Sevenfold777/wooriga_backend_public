import { Module } from '@nestjs/common';
import { UserInquiryService } from './user-inquiry.service';
import { UserInquiryController } from './user-inquiry.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInquiry } from './entities/user-inquiry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserInquiry])],
  controllers: [UserInquiryController],
  providers: [UserInquiryService],
})
export class UserInquiryModule {}
