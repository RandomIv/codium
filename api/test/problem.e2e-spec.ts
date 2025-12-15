import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createProblemDtoStub,
  updateProblemDtoStub,
} from '../src/problem/problem.stubs';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { createTestApp } from './utils/create-test-app';

describe('ProblemController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    await prisma.problem.deleteMany();
  });

  describe('POST /api/problems', () => {
    it('creates a problem [201]', async () => {
      return request(app.getHttpServer())
        .post('/api/problems')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createProblemDtoStub)
        .expect(201)
        .expect(({ body }) => {
          expect(body.title).toBe(createProblemDtoStub.title);
          expect(body.id).toEqual(expect.any(String));
        });
    });
  });

  describe('GET /api/problems', () => {
    it('returns a list of problems [200]', async () => {
      await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/problems')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe(createProblemDtoStub.slug);
    });
  });

  describe('GET /api/problems/:slug', () => {
    it('returns a problem by slug [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });

      return request(app.getHttpServer())
        .get(`/api/problems/${createdProblem.slug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
        });
    });

    it('returns 404 for non-existent slug', () => {
      return request(app.getHttpServer())
        .get('/api/problems/fake-slug-12345')
        .expect(404);
    });
  });
  describe('GET /api/problems/system/:id', () => {
    it('returns a problem by id [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });
      return request(app.getHttpServer())
        .get(`/api/problems/system/${createdProblem.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
        });
    });
    it('returns 401 for unauthorized requests', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });

      return request(app.getHttpServer())
        .get(`/api/problems/system/${createdProblem.id}`)
        .expect(401);
    });
    it('returns 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get(`/api/problems/system/fake-id-12345`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .expect(404);
    });
  });

  describe('GET /api/problems/admin/:id', () => {
    it('returns a problem by id with JWT auth [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: {
            create: [
              {
                input: '[[2,7,11,15], 9]',
                output: '[0,1]',
                isPublic: true,
              },
              {
                input: '[[3,2,4], 6]',
                output: '[1,2]',
                isPublic: false,
              },
            ],
          },
        },
      });

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${createdProblem.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
          expect(body.testCases).toBeDefined();
          expect(body.testCases).toHaveLength(2);
        });
    });

    it('returns 401 for unauthorized requests', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${createdProblem.id}`)
        .expect(401);
    });

    it('returns 404 for non-existent id', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
  describe('PATCH /api/problems/:id', () => {
    it('updates a problem [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: {
            create: [
              {
                input: '[[2,7,11,15], 9]',
                output: '[0,1]',
                isPublic: true,
              },
            ],
          },
        },
      });

      return request(app.getHttpServer())
        .patch(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateProblemDtoStub)
        .expect(200)
        .expect(({ body }) => {
          expect(body.title).toBe(updateProblemDtoStub.title);
        });
    });

    it('returns 404 when id does not exist', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .patch(`/api/problems/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateProblemDtoStub)
        .expect(404);
    });
  });

  describe('DELETE /api/problems/:id', () => {
    it('deletes a problem [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: {
          ...createProblemDtoStub,
          testCases: undefined,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const found = await prisma.problem.findUnique({
        where: { id: createdProblem.id },
      });
      expect(found).toBeNull();
    });
  });
});
