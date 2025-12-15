import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { createSubmissionDtoStub } from '../src/submission/submission.stubs';
import { createProblemDtoStub } from '../src/problem/problem.stubs';
import { SubmissionStatus, Verdict } from '../src/generated/prisma';
import { createTestApp } from './utils/create-test-app';

describe('SubmissionController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testProblemId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.submission.deleteMany();
    await prisma.problem.deleteMany();

    const { testCases, ...problemData } = createProblemDtoStub;
    const problem = await prisma.problem.create({
      data: problemData,
    });
    testProblemId = problem.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'test@example.com' },
    });
    testUserId = user.id;
  });

  describe('POST /api/submissions', () => {
    it('creates a submission [201]', async () => {
      const submissionData = {
        ...createSubmissionDtoStub,
        problemId: testProblemId,
        userId: testUserId,
      };

      return request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(submissionData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toEqual(expect.any(String));
          expect(body.code).toBe(submissionData.code);
          expect(body.language).toBe(submissionData.language);
          expect(body.problemId).toBe(testProblemId);
          expect(body.userId).toBe(testUserId);
          expect(body.status).toBe('PENDING');
        });
    });

    it('returns 400 for invalid language', async () => {
      const invalidSubmission = {
        ...createSubmissionDtoStub,
        problemId: testProblemId,
        userId: testUserId,
        language: 'INVALID_LANGUAGE',
      };

      return request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSubmission)
        .expect(400);
    });

    it('returns 400 for missing required fields', async () => {
      return request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'def test(): pass',
        })
        .expect(400);
    });

    it('returns 400 for invalid UUID format', async () => {
      const invalidSubmission = {
        ...createSubmissionDtoStub,
        problemId: 'not-a-uuid',
        userId: testUserId,
      };

      return request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSubmission)
        .expect(400);
    });
  });

  describe('GET /api/submissions/:id', () => {
    it('returns a submission by id [200]', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      return request(app.getHttpServer())
        .get(`/api/submissions/${createdSubmission.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdSubmission.id);
          expect(body.code).toBe(createdSubmission.code);
          expect(body.status).toBe('PENDING');
        });
    });

    it('returns 404 for non-existent id', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      return request(app.getHttpServer())
        .get(`/api/submissions/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('returns submission with all fields', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
          status: SubmissionStatus.COMPLETED,
          verdict: Verdict.ACCEPTED,
          time: 100,
          memory: 2048,
          testCasesPassed: 5,
        },
      });

      return request(app.getHttpServer())
        .get(`/api/submissions/${createdSubmission.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.verdict).toBe('ACCEPTED');
          expect(body.time).toBe(100);
          expect(body.memory).toBe(2048);
          expect(body.testCasesPassed).toBe(5);
        });
    });
  });

  describe('PATCH /api/submissions/:id', () => {
    it('updates a submission [200]', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      const updateData = {
        status: SubmissionStatus.COMPLETED,
        verdict: Verdict.ACCEPTED,
        time: 100,
        memory: 2048,
        testCasesPassed: 5,
      };

      return request(app.getHttpServer())
        .patch(`/api/submissions/${createdSubmission.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(updateData.status);
          expect(body.verdict).toBe(updateData.verdict);
          expect(body.time).toBe(updateData.time);
          expect(body.memory).toBe(updateData.memory);
          expect(body.testCasesPassed).toBe(updateData.testCasesPassed);
        });
    });

    it('returns 401 for unauthorized requests', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      return request(app.getHttpServer())
        .patch(`/api/submissions/${createdSubmission.id}`)
        .send({ status: SubmissionStatus.COMPLETED })
        .expect(401);
    });

    it('returns 404 when id does not exist', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      return request(app.getHttpServer())
        .patch(`/api/submissions/${fakeId}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .send({ status: SubmissionStatus.COMPLETED })
        .expect(404);
    });

    it('updates submission with test logs', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      const updateData = {
        status: SubmissionStatus.COMPLETED,
        verdict: Verdict.ACCEPTED,
        time: 100,
        memory: 2048,
        testCasesPassed: 1,
        testLogs: [
          {
            testCaseId: 'test-1',
            status: Verdict.ACCEPTED,
            input: '[2,7,11,15],9',
            expectedOutput: '[0,1]',
            actualOutput: '[0,1]',
            executionTime: 20,
            memory: 512,
          },
        ],
      };

      return request(app.getHttpServer())
        .patch(`/api/submissions/${createdSubmission.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.testLogs).toBeDefined();
          expect(Array.isArray(body.testLogs)).toBe(true);
        });
    });

    it('returns 400 for invalid status enum', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      return request(app.getHttpServer())
        .patch(`/api/submissions/${createdSubmission.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('updates only provided fields', async () => {
      const createdSubmission = await prisma.submission.create({
        data: {
          ...createSubmissionDtoStub,
          problemId: testProblemId,
          userId: testUserId,
        },
      });

      const partialUpdate = {
        status: SubmissionStatus.IN_PROGRESS,
      };

      return request(app.getHttpServer())
        .patch(`/api/submissions/${createdSubmission.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .send(partialUpdate)
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe(partialUpdate.status);
          expect(body.code).toBe(createdSubmission.code);
          expect(body.language).toBe(createdSubmission.language);
        });
    });
  });
});
