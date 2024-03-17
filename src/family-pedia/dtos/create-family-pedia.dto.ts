import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFamilyPediaInput {
  @IsNumber()
  ownerId: number;
}
