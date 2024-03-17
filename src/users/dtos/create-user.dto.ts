import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { AuthProvider, FamilyPosition, User } from '../entities/user.entity';

export class CreateUserInput {
  @IsEmail()
  email: string;

  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  birthday: string;

  @IsOptional()
  @IsBoolean()
  isBirthLunar?: boolean;

  @IsEnum(FamilyPosition)
  position: FamilyPosition;

  @IsOptional()
  @IsString()
  familyToken?: string;

  @IsBoolean()
  mktPushAgreed: boolean;

  @IsOptional()
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  nonce: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class CreateUserOutput extends BaseOutput {
  @IsOptional()
  @IsNumber()
  user?: User;
}
