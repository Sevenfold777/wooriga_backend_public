import { PartialType } from '@nestjs/mapped-types';
import { CreateLetterThemeInput } from './create-letter-theme.dto';

export class EditLetterThemeInput extends PartialType(CreateLetterThemeInput) {}
