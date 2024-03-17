import { PartialType } from '@nestjs/mapped-types';
import { CreateUserInquiryInput } from './create-user-inquiry.dto';

export class EditUserInquiryInput extends PartialType(CreateUserInquiryInput) {}
