import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';

export class EditPediaPhotoOutput extends BaseOutput {
  @IsOptional()
  profilePhoto?: string;
}
