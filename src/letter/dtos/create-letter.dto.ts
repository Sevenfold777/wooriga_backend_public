import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';

export class CreateLetterInput {
  @IsString()
  title: string;

  @IsString()
  payload: string;

  @IsEnum(DailyEmotions)
  emotion: DailyEmotions;

  @IsBoolean()
  isTimeCapsule: boolean;

  @IsOptional()
  receiveDate?: Date;

  @IsNumber({}, { each: true })
  receivers: number[];

  @IsOptional()
  @IsNumber()
  themeId: number;

  @IsOptional()
  @IsBoolean()
  isTemp?: boolean;
}

export class CreateLetterOutput extends BaseOutput {
  id?: number;
}
