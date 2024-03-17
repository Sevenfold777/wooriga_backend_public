import { IsNotEmpty, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class CreateRowInput {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @Column()
  @IsNotEmpty()
  payload: string;
}
