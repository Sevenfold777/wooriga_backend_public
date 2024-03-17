import { IsOptional, IsString } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';

export class InviteFamilyOutput extends BaseOutput {
  @IsOptional()
  @IsString()
  token?: string;
}
