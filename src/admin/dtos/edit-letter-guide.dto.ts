import { PartialType } from '@nestjs/mapped-types';
import { CreateLetterGuideInput } from './create-letter-guide.dto';

export class EditLetterGuideInput extends PartialType(CreateLetterGuideInput) {}
