import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createProblemDtoStub,
  updateProblemDtoStub,
} from '../src/problem/problem.stubs';

describe('ProblemController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
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
      await prisma.problem.create({ data: createProblemDtoStub });

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
        data: createProblemDtoStub,
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

  describe('PATCH /api/problems/:id', () => {
    it('updates a problem [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: createProblemDtoStub,
      });

      return request(app.getHttpServer())
        .patch(`/api/problems/${createdProblem.id}`)
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
        .send(updateProblemDtoStub)
        .expect(404);
    });
  });

  describe('DELETE /api/problems/:id', () => {
    it('deletes a problem [200]', async () => {
      const createdProblem = await prisma.problem.create({
        data: createProblemDtoStub,
      });

      await request(app.getHttpServer())
        .delete(`/api/problems/${createdProblem.id}`)
        .expect(200);

      const found = await prisma.problem.findUnique({
        where: { id: createdProblem.id },
      });
      expect(found).toBeNull();
    });
  });
});
