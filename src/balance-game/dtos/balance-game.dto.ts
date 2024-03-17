import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class BalanceGameOutput {
  @IsNumber()
  id: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsString()
  question: string;

  @IsString()
  choiceA: string;

  @IsString()
  choiceB: string;

  @IsBoolean()
  isAnswered: boolean;

  @IsString()
  commentDecorator?: string;
}

export class BalanceGameFamilyOutput {
  @IsNumber()
  id: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsString()
  question: string;

  @IsString()
  choiceA: string;

  @IsString()
  choiceB: string;

  choices: {
    userId: number;
    userName: string;
    choiceId: number | null;
    payload: string | null;
  }[];
}
