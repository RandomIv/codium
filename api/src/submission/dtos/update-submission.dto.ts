import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { SubmissionStatus, Verdict } from '../../generated/prisma';

export class UpdateSubmissionDto {
  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsOptional()
  testLogs?: any;

  @IsOptional()
  @IsEnum(Verdict)
  verdict?: Verdict;
}
