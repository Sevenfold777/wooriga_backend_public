import { PartialType } from '@nestjs/mapped-types';
import { CreateLetterInput } from './create-letter.dto';

export class EditLetterInput extends PartialType(CreateLetterInput) {}
