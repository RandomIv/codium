import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus, Verdict } from '../../generated/prisma';

class TestLogEntryDto {
  @IsString()
  testCaseId: string;

  @IsEnum(Verdict)
  status: Verdict;

  @IsString()
  input: string;

  @IsString()
  expectedOutput: string;

  @IsString()
  actualOutput: string;

  @IsOptional()
  @IsString()
  stderr?: string;

  @IsNumber()
  executionTime: number;

  @IsNumber()
  memory: number;
}

export class UpdateSubmissionDto {
  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestLogEntryDto)
  testLogs?: TestLogEntryDto[];

  @IsOptional()
  @IsEnum(Verdict)
  verdict?: Verdict;

  @IsOptional()
  @IsNumber()
  time?: number;

  @IsOptional()
  @IsNumber()
  memory?: number;

  @IsOptional()
  @IsNumber()
  testCasesPassed?: number;
}
