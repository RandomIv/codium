import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Processor('judge-queue')
export class JudgeProcessor extends WorkerHost {
  constructor(private readonly configService: ConfigService) {
    super();
  }
  async process(job: Job) {
    const { problemId, code, language } = job.data;
    const submissionId = job.id;

    const apiUrl = this.configService.getOrThrow('API_URL').replace(/\/$/, '');
    const systemApiKey = this.configService.getOrThrow('SYSTEM_API_KEY');
    const url = `${apiUrl}/problems/system/${problemId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'x-system-api-key': systemApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch problem. Status: ${response.status} ${response.statusText}`,
        );
      }

      const problemData = await response.json();
      console.log(
        ` Loaded problem ${problemData.title}. Tests: ${problemData.testCases.length}`,
      );

      //check code here

      return { status: 'Processing link established' };
    } catch (error) {
      console.error(`Judge failed for #${submissionId}:`, error.message);
      throw error;
    }
  }
}
