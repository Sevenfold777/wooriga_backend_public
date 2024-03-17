import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageInput } from './create-message.dto';

export class EditMessageInput extends PartialType(CreateMessageInput) {}
