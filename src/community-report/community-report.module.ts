import { Module } from '@nestjs/common';
import { CommunityReportService } from './community-report.service';
import { CommunityReportController } from './community-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityReport } from './entities/community-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityReport])],
  controllers: [CommunityReportController],
  providers: [CommunityReportService],
})
export class CommunityReportModule {}
