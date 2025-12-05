import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { Submission } from '../generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class SubmissionService {
  constructor(
    @InjectQueue('judge-queue') private readonly judgeQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  async create(data: CreateSubmissionDto): Promise<Submission> {
    const submission = await this.prisma.submission.create({ data });
    const job = await this.judgeQueue.add(
      'judge',
      {
        problemId: data.problemId,
        code: data.code,
        language: data.language,
      },
      {
        jobId: submission.id,
        removeOnComplete: true,
      },
    );
    return submission;
  }
}
