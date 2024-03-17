import { IsString } from 'class-validator';

export class CommentMessageInput {
  @IsString()
  payload: string;
}
