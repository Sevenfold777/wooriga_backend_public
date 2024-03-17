import { IsEnum } from 'class-validator';
import { DailyEmotions } from '../entities/emotion.entity';

export class CreateDailyEmoInput {
  @IsEnum(DailyEmotions)
  type: DailyEmotions;
}
