import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';

export class CreateLetterGuideInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  payload: string;

  @IsEnum(DailyEmotions)
  emotion: DailyEmotions;

  @IsOptional()
  @IsBoolean()
  isPinned: boolean;
}
