import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreateMessageFamInput } from './create-message-family.dto';

export class EditMessageFamInput extends PartialType(CreateMessageFamInput) {}
