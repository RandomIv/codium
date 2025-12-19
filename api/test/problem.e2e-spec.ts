import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createProblemDtoStub,
  updateProblemDtoStub,
} from '../src/problem/problem.stubs';
import {
  createTestAppWithRoles,
  stopTestDbContainer,
} from './utils/create-test-app';

describe('ProblemController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;

  const createProblemData = (overrides = {}) => ({
    ...createProblemDtoStub,
    testCases: undefined,
    ...overrides,
  });

  const createProblemInDb = async (overrides = {}) => {
    return prisma.problem.create({
      data: createProblemData(overrides),
    });
  };

  beforeAll(async () => {
    const testApp = await createTestAppWithRoles();
    app = testApp.app;
    prisma = testApp.prisma;
    adminToken = testApp.adminToken;
    userToken = testApp.userToken;
  });

  afterAll(async () => {
    await app.close();
    await stopTestDbContainer();
  });

  beforeEach(async () => {
    await prisma.problem.deleteMany();
  });

  describe('POST /api/problems', () => {
    it('should create a problem with admin token and return 201 status', async () => {
      return request(app.getHttpServer())
        .post('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createProblemDtoStub)
        .expect(201)
        .expect(({ body }) => {
          expect(body.title).toBe(createProblemDtoStub.title);
          expect(body.id).toEqual(expect.any(String));
        });
    });

    it('should return 403 when user (non-admin) tries to create a problem', async () => {
      return request(app.getHttpServer())
        .post('/api/problems')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createProblemDtoStub)
        .expect(403);
    });

    it('should return 401 when no token is provided', async () => {
      return request(app.getHttpServer())
        .post('/api/problems')
        .send(createProblemDtoStub)
        .expect(401);
    });
  });

  describe('GET /api/problems', () => {
    it('should return a list of problems with 200 status (no auth required)', async () => {
      await createProblemInDb();

      const res = await request(app.getHttpServer())
        .get('/api/problems')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe(createProblemDtoStub.slug);
    });

    it('should return a list of problems with user token', async () => {
      await createProblemInDb();

      const res = await request(app.getHttpServer())
        .get('/api/problems')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe(createProblemDtoStub.slug);
    });

    it('should return a list of problems with admin token', async () => {
      await createProblemInDb();

      const res = await request(app.getHttpServer())
        .get('/api/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].slug).toBe(createProblemDtoStub.slug);
    });
  });

  describe('GET /api/problems/:slug', () => {
    it('should return a problem by slug with 200 status (no auth required)', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/${createdProblem.slug}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
        });
    });

    it('should return a problem by slug with token', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/${createdProblem.slug}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
        });
    });

    it('should return 404 for non-existent slug', () => {
      return request(app.getHttpServer())
        .get('/api/problems/fake-slug-12345')
        .expect(404);
    });
  });

  describe('GET /api/problems/system/:id', () => {
    it('should return a problem by id with 200 status when using system API key', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/system/${createdProblem.id}`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
        });
    });

    it('should return 401 for unauthorized requests without system API key', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/system/${createdProblem.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id with system API key', () => {
      return request(app.getHttpServer())
        .get(`/api/problems/system/fake-id-12345`)
        .set('x-system-api-key', process.env.SYSTEM_API_KEY ?? '')
        .expect(404);
    });
  });

  describe('GET /api/problems/admin/:id', () => {
    it('should return a problem by id with admin token and 200 status', async () => {
      const createdProblem = await createProblemInDb({
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
      });

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${createdProblem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdProblem.id);
          expect(body.slug).toBe(createdProblem.slug);
          expect(body.testCases).toBeDefined();
          expect(body.testCases).toHaveLength(2);
        });
    });

    it('should return 403 when user (non-admin) tries to access', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${createdProblem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 401 when no token is provided', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${createdProblem.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id with admin token', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .get(`/api/problems/admin/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/problems/:id', () => {
    it('should update a problem with admin token and return 200 status', async () => {
      const createdProblem = await createProblemInDb({
        testCases: {
          create: [
            {
              input: '[[2,7,11,15], 9]',
              output: '[0,1]',
              isPublic: true,
            },
          ],
        },
      });

      return request(app.getHttpServer())
        .patch(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProblemDtoStub)
        .expect(200)
        .expect(({ body }) => {
          expect(body.title).toBe(updateProblemDtoStub.title);
        });
    });

    it('should return 403 when user (non-admin) tries to update', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .patch(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateProblemDtoStub)
        .expect(403);
    });

    it('should return 401 when no token is provided', async () => {
      const createdProblem = await createProblemInDb();

      return request(app.getHttpServer())
        .patch(`/api/problems/${createdProblem.id}`)
        .send(updateProblemDtoStub)
        .expect(401);
    });

    it('should return 404 when id does not exist with admin token', () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      return request(app.getHttpServer())
        .patch(`/api/problems/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateProblemDtoStub)
        .expect(404);
    });
  });

  describe('DELETE /api/problems/:id', () => {
    it('should delete a problem with admin token and return 200 status', async () => {
      const createdProblem = await createProblemInDb();

      await request(app.getHttpServer())
        .delete(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = await prisma.problem.findUnique({
        where: { id: createdProblem.id },
      });
      expect(found).toBeNull();
    });

    it('should return 403 when user (non-admin) tries to delete', async () => {
      const createdProblem = await createProblemInDb();

      await request(app.getHttpServer())
        .delete(`/api/problems/${createdProblem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      const found = await prisma.problem.findUnique({
        where: { id: createdProblem.id },
      });
      expect(found).not.toBeNull();
    });

    it('should return 401 when no token is provided', async () => {
      const createdProblem = await createProblemInDb();

      await request(app.getHttpServer())
        .delete(`/api/problems/${createdProblem.id}`)
        .expect(401);

      const found = await prisma.problem.findUnique({
        where: { id: createdProblem.id },
      });
      expect(found).not.toBeNull();
    });

    it('should return 404 when id does not exist with admin token', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .delete(`/api/problems/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
