import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCommunityReportInput } from './dtos/create-community-report.dto';
import {
  CommunityReport,
  ReportType,
} from './entities/community-report.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class CommunityReportService {
  constructor(
    @InjectRepository(CommunityReport)
    private reportRepository: Repository<CommunityReport>,
  ) {}

  async createCommunityReport(
    { userId }: UserId,
    createCommunityReportInput: CreateCommunityReportInput,
  ): Promise<BaseOutput> {
    const newReport = this.reportRepository.create({
      ...createCommunityReportInput,
      reporter: { id: userId },
    });

    try {
      await this.reportRepository.save(newReport);
    } catch (e) {
      return { ok: false, error: 'Cannot create report.' };
    }

    return { ok: true };
  }
}
