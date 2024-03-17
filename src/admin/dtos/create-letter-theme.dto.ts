import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { LetterHashtag } from 'src/letter/entities/letter-hashtag.entity';

export class CreateLetterThemeInput {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  payload: string; // webview url?

  @IsNotEmpty()
  @IsString()
  recommendText: string;

  @IsNotEmpty()
  @IsString()
  example: string;

  @IsArray()
  @Type(() => LetterHashtag)
  hashtags: LetterHashtag[];
}

export class CreateLetterThemeOutput extends BaseOutput {
  id?: number;
}
