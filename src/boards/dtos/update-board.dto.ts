import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBoardInput } from './create-board.dto';

export class EditBoardInput extends PartialType(CreateBoardInput) {
  @IsOptional()
  @IsBoolean()
  isShown?: boolean;
}
