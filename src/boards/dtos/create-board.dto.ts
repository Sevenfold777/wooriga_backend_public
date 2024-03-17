import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  url: string;
}
