import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.setGlobalPrefix('api');
  await app.init();

  const prisma = app.get<PrismaService>(PrismaService);

  return { app, prisma };
}

export async function createTestAppWithAuth(
  credentials = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  authToken: string;
}> {
  const { app, prisma } = await createTestApp();

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send(credentials);

  const loginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: credentials.email,
      password: credentials.password,
    });

  const authToken = loginResponse.body.accessToken;

  return { app, prisma, authToken };
}
