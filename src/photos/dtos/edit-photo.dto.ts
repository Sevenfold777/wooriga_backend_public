import { PartialType } from '@nestjs/mapped-types';
import { CreatePhotoInput } from './create-photo.dto';

export class EditPhotoInput extends PartialType(CreatePhotoInput) {}
