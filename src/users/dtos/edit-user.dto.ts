import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { CreateUserInput } from './create-user.dto';

export class EditUserInput extends PartialType(CreateUserInput) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EditUserOutput extends BaseOutput {}
