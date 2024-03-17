import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { AuthProvider } from '../entities/user.entity';

export class LoginUserInput {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isSignUp?: boolean;
}

export class LoginUserOutput extends BaseOutput {
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsBoolean()
  signUpRequired?: boolean;
}

export class LoginTokenInput {
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  nonce?: string;

  @IsOptional()
  @IsBoolean()
  isSignUp?: boolean;
}
