import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';

export class CommentPhotoInput {
  @IsString()
  payload: string;
}

export class EditPhotoCommentInput extends PartialType(CommentPhotoInput) {}
