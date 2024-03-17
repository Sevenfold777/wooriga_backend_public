import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { CommunityReportService } from './community-report.service';
import { CreateCommunityReportInput } from './dtos/create-community-report.dto';

@Controller('communityReport')
export class CommunityReportController {
  constructor(
    private readonly communityReportService: CommunityReportService,
  ) {}

  @Post()
  createCommunityReport(
    @AuthUser() user: UserId,
    @Body() createCommunityReportInput: CreateCommunityReportInput,
  ): Promise<BaseOutput> {
    return this.communityReportService.createCommunityReport(
      user,
      createCommunityReportInput,
    );
  }
}
