import { IsBoolean, IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateMessageFamInput {
  @IsNumber()
  messageId: number;

  @IsOptional()
  @IsBoolean()
  isNow?: boolean;

  @IsOptional()
  receiveDate?: Date;
  // @IsNumber()
  // familyId: number;
}
