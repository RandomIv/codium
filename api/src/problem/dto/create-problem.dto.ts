import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Min,
} from 'class-validator';
import { Difficulty } from '../../generated/prisma';
export class CreateProblemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  timeLimit: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  memoryLimit: number;

  @IsNotEmpty()
  @IsObject()
  starterCode: Record<string, string>;
}
