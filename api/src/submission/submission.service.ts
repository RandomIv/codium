import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SubmissionService {
  constructor(@InjectQueue('judge-queue') private readonly judgeQueue: Queue) {}
  async create(data: any) {
    const job = await this.judgeQueue.add('test-job', {
      code: data.code,
      lang: data.lang,
    });

    return {
      status: 'submitted',
      jobId: job.id,
    };
  }
}
