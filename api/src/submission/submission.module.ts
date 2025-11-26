import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionService } from './submission.service';

@Module({
  controllers: [SubmissionController],
  imports: [BullModule.registerQueue({ name: 'judge-queue' })],
  providers: [SubmissionService],
})
export class SubmissionModule {}
