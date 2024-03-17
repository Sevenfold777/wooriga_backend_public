import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LetterNotifOutput {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  screen: string;

  @IsOptional()
  @IsString()
  param?: string;
}
