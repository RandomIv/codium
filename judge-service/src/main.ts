import { NestFactory } from '@nestjs/core';
import { JudgeModule } from './judge.module';

async function bootstrap() {
  const app = await NestFactory.create(JudgeModule);
  await app.listen(process.env.PORT ?? 6000);
}
bootstrap();
