import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Language } from '../../generated/prisma';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;

  @IsNotEmpty()
  @IsUUID()
  problemId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
