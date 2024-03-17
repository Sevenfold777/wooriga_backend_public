import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyEmoInput } from './create-daily-emotion.dto';

export class EditDailyEmoInput extends PartialType(CreateDailyEmoInput) {}
