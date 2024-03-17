import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReportTarget, ReportType } from '../entities/community-report.entity';

export class CreateCommunityReportInput {
  @IsEnum(ReportTarget)
  targetType: ReportTarget; // 신고 대상 타입

  @IsNumber()
  targetId: number; // 신고 대상 id

  @IsEnum(ReportType)
  reportType: ReportType; // 신고 사유

  @IsOptional()
  @IsString()
  payload: string; // 기타 사유
}
