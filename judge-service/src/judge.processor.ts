import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('judge-queue')
export class JudgeProcessor extends WorkerHost {
  async process(job: Job<any, any, string>) {
    console.log(`Judge received job#${job.id}`);
    console.log('Code: ', job.data.code);
    return {};
  }
}
