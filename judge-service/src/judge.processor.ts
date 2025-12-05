import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ApiService } from './api/api.service';

@Processor('judge-queue')
export class JudgeProcessor extends WorkerHost {
  constructor(private readonly apiService: ApiService) {
    super();
  }

  async process(job: Job) {
    const { problemId, code, language } = job.data;
    const submissionId = job.id as string;

    try {
      await this.apiService.updateSubmission(submissionId, {
        status: 'IN_PROGRESS',
      });

      const problemData = await this.apiService.getProblem(problemId);

      // TODO: Logic execution here
      console.log(problemData);
      return { status: 'Job processed successfully' };
    } catch (error) {
      console.error(`Judge failed for #${submissionId}:`, error.message);

      await this.apiService
        .updateSubmission(submissionId, { status: 'FAILED' })
        .catch(() => {});

      throw error;
    }
  }
}
