import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { Submission, Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectQueue('judge-queue') private readonly judgeQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  async findOne(id: string): Promise<Submission> {
    return this.prisma.submission.findUniqueOrThrow({ where: { id } });
  }
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
  async update(id: string, data: UpdateSubmissionDto): Promise<Submission> {
    const { testLogs, ...otherData } = data;

    const testLogsJson = testLogs
      ? (JSON.parse(JSON.stringify(testLogs)) as Prisma.InputJsonValue)
      : undefined;

    return this.prisma.submission.update({
      where: { id },
      data: {
        ...otherData,
        ...(testLogsJson && {
          testLogs: testLogsJson,
        }),
      },
    });
  }
}
