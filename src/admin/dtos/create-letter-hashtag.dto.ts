import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLetterHashTagInput {
  @IsNotEmpty()
  @IsString()
  name: string;
}
