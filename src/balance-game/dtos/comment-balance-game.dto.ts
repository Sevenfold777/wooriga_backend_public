import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

export class CommentBalanceGameInput {
  @IsString()
  payload: string;
}
