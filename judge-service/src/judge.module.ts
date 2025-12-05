import { Module } from '@nestjs/common';
import { JudgeProcessor } from './judge.processor';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ApiService } from './api/api.service';

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.registerQueue({ name: 'judge-queue' }),
  ],
  controllers: [],
  providers: [JudgeProcessor, ApiService],
})
export class JudgeModule {}
