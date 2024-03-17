import { PartialType } from '@nestjs/mapped-types';
import { IsNumber } from 'class-validator';
import { CreateRowInput } from './create-row.dto';

export class EditRowInput extends PartialType(CreateRowInput) {
  @IsNumber()
  id: number;
}
