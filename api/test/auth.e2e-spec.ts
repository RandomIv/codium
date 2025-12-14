import * as dotenv from 'dotenv';
// Вантажимо змінні з локального тестового файлу перед усім іншим
dotenv.config({ path: '.env.test.local' });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prismaService.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const registerDto = {
        email: 'e2e-test@example.com',
        password: 'password123',
        name: 'E2E Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toBe(
        'User registered successfully. Please login.',
      );

      const user = await prismaService.user.findUnique({
        where: { id: response.body.userId },
      });
      expect(user).toBeDefined();
    });

    it('should return 409 when email already exists', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate User',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toMatch(/exists|registered/i);
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'password123', name: 'Test User' })
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'Test User' })
        .expect(400);
    });

    it('should not expose password in response', async () => {
      const registerDto = {
        email: 'secure@example.com',
        password: 'password123',
        name: 'Secure User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).not.toHaveProperty('password');
    });

    it('should create user with correct default role', async () => {
      const registerDto = {
        email: 'role-test@example.com',
        password: 'password123',
        name: 'Role Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      const user = await prismaService.user.findUnique({
        where: { id: response.body.userId },
      });

      expect(user?.role).toBe('USER');
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser: { email: string; password: string; userId: string };

    beforeEach(async () => {
      const registerDto = {
        email: 'login-user@example.com',
        password: 'password123',
        name: 'Login Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register') // Додано /api
        .send(registerDto)
        .expect(201);

      registeredUser = {
        email: registerDto.email,
        password: registerDto.password,
        userId: response.body.userId,
      };
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login') // Додано /api
        .send({
          email: registeredUser.email,
          password: registeredUser.password,
        })
        .expect(201);

      expect(response.body.message).toBe('User login successfully');
      expect(response.body.userId).toBe(registeredUser.userId);
    });

    it('should return 401 with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: registeredUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: registeredUser.password })
        .expect(401);
    });

    it('should return 401 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: registeredUser.email })
        .expect(401);
    });

    it('should generate valid JWT token on successful login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registeredUser.email,
          password: registeredUser.password,
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();

      const tokenParts = response.body.accessToken.split('.');
      expect(tokenParts).toHaveLength(3);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      const credentials = {
        email: 'flow-test@example.com',
        password: 'password123',
        name: 'Flow Test User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register') // Додано /api
        .send(credentials)
        .expect(201);

      const userId = registerResponse.body.userId;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login') // Додано /api
        .send({ email: credentials.email, password: credentials.password })
        .expect(201);

      expect(loginResponse.body.userId).toBe(userId);
    });

    it('should reject login before registration', async () => {
      const credentials = {
        email: 'not-registered@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login') // Додано /api
        .send(credentials)
        .expect(401);
    });
  });
});
