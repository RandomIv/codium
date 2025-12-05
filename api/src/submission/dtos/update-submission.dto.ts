import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { SubmissionStatus, Verdict } from '../../generated/prisma';

export class UpdateSubmissionDto {
  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  @IsObject()
  testLogs?: Record<string, any>;

  @IsOptional()
  @IsEnum(Verdict)
  Verdict?: Verdict;
}
