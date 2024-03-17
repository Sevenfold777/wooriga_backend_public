import { IsEnum, IsNumber, IsString } from 'class-validator';
import { DailyEmotions } from '../entities/emotion.entity';

export class UserEmotion {
  @IsNumber()
  userId: number;

  @IsString()
  userName: string;

  @IsNumber()
  familyId: number;

  @IsNumber()
  emotionId: number;

  @IsEnum(DailyEmotions)
  type: DailyEmotions;
}
