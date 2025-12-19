import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../../src/common/filters/prisma-exception.filter';
import { startTestDbContainer, stopTestDbContainer } from './test-db-container';

let isContainerRunning = false;

async function cleanDatabase(prisma: PrismaService) {
  await prisma.submission.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  if (!isContainerRunning) {
    await startTestDbContainer();
    isContainerRunning = true;
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.setGlobalPrefix('api');
  await app.init();

  const prisma = app.get<PrismaService>(PrismaService);

  await cleanDatabase(prisma);

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

export async function createTestAppWithRoles(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  adminToken: string;
  userToken: string;
}> {
  const { app, prisma } = await createTestApp();

  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['admin@example.com', 'user@example.com'],
      },
    },
  });

  const adminRegResponse = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
    });

  if (adminRegResponse.status !== 201) {
    throw new Error(
      `Admin registration failed: ${JSON.stringify(adminRegResponse.body)}`,
    );
  }

  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { role: 'ADMIN' },
  });

  const adminLoginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'admin123',
    });

  if (adminLoginResponse.status !== 201 && adminLoginResponse.status !== 200) {
    throw new Error(
      `Admin login failed: ${JSON.stringify(adminLoginResponse.body)}`,
    );
  }

  const adminToken = adminLoginResponse.body.accessToken;

  if (!adminToken) {
    throw new Error('Admin token is undefined');
  }

  const userRegResponse = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: 'user@example.com',
      password: 'user1234',
      name: 'Regular User',
    });

  if (userRegResponse.status !== 201) {
    throw new Error(
      `User registration failed: ${JSON.stringify(userRegResponse.body)}`,
    );
  }

  const userLoginResponse = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: 'user@example.com',
      password: 'user1234',
    });

  if (userLoginResponse.status !== 201 && userLoginResponse.status !== 200) {
    throw new Error(
      `User login failed: ${JSON.stringify(userLoginResponse.body)}`,
    );
  }

  const userToken = userLoginResponse.body.accessToken;

  if (!userToken) {
    throw new Error('User token is undefined');
  }

  return { app, prisma, adminToken, userToken };
}

export { stopTestDbContainer };
