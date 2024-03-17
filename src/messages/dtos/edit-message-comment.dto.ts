import { PartialType } from '@nestjs/mapped-types';
import { CommentMessageFamInput } from './comment-message-family.dto';
import { CommentMessageInput } from './comment-message.dto';

export class EditMessageCommentInput extends PartialType(CommentMessageInput) {}

export class EditMessageFamCommentInput extends PartialType(
  CommentMessageFamInput,
) {}
