import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserInquiryInput {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  payload: string;
}
