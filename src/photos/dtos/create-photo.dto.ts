import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreatePhotoInput {
  @IsNotEmpty()
  @IsString()
  theme: string;

  @IsString()
  payload?: string;
}
