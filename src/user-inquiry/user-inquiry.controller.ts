import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateUserInquiryInput } from './dtos/create-user-inquiry.dto';
import { EditUserInquiryInput } from './dtos/edit-user-inquiry.dto';
import { UserInquiry } from './entities/user-inquiry.entity';
import { UserInquiryService } from './user-inquiry.service';

@Controller('userInquiry')
export class UserInquiryController {
  constructor(private readonly userInquiryService: UserInquiryService) {}

  @Post()
  createInquiry(
    @AuthUser() user: UserId,
    @Body() createInquiryInput: CreateUserInquiryInput,
  ): Promise<BaseOutput> {
    return this.userInquiryService.createInquiry(user, createInquiryInput);
  }

  @Delete(':id')
  deleteInquiry(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.userInquiryService.deleteInquiry(user, id);
  }

  @Patch(':id')
  editInquiry(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editInquiryInput: EditUserInquiryInput,
  ): Promise<BaseOutput> {
    return this.userInquiryService.editInquiry(user, id, editInquiryInput);
  }

  @Get(':id')
  findInquiry(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<UserInquiry> {
    return this.userInquiryService.findInquiry(user, id);
  }

  @Get()
  findMyInquiries(
    @AuthUser() user: UserId,
    @Query('prev') prev = 0,
  ): Promise<UserInquiry[]> {
    return this.userInquiryService.findMyInquiries(user, prev);
  }
}
