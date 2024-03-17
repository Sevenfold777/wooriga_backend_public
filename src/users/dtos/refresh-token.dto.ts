import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RefreshTokenInput {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
