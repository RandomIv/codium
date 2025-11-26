import { Module } from '@nestjs/common';
import { JudgeProcessor } from './judge.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue({ name: 'judge-queue' }),
  ],
  controllers: [],
  providers: [JudgeProcessor],
})
export class AppModule {}
