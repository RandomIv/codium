import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionModule } from './submission/submission.module';
import { ProblemModule } from './problem/problem.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    SubmissionModule,
    ProblemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
