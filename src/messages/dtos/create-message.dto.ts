import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { ServiceLinked } from '../entities/message.entity';

export class CreateMessageInput {
  @IsNotEmpty()
  @IsString()
  payload: string;

  @IsEnum(DailyEmotions)
  emotion: DailyEmotions;

  @IsBoolean()
  isNow: boolean;

  @IsOptional()
  @IsDateString()
  uploadAt?: Date;

  @IsOptional()
  @IsEnum(ServiceLinked)
  linkTo?: ServiceLinked;
}

export class CreateMessageOutput extends BaseOutput {
  @IsOptional()
  @IsNumber()
  id?: number;
}
