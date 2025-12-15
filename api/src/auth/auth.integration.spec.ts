import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

describe('AuthService Integration with UserService', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userService: UserService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const envFile = '.env.test.local';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: envFile,
          load: [
            () => ({
              JWT_EXPIRATION: '1h',
            }),
          ],
        }),
        PassportModule,
        JwtModule.register({
          secret: 'test-jwt-secret-for-e2e',
          signOptions: {
            expiresIn: '1h',
          },
        }),
      ],
      providers: [
        AuthService,
        UserService,
        PrismaService,
        LocalStrategy,
        JwtStrategy,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userService = moduleFixture.get<UserService>(UserService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    await prismaService.user.deleteMany({});
  });

  describe('User Registration Flow', () => {
    it('should register a new user and hash password', async () => {
      const registerDto = {
        email: 'integration-test@example.com',
        password: 'password123',
        name: 'Integration Test User',
      };

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
      expect(result.message).toBe(
        'User registered successfully. Please login.',
      );

      const user = await userService.findOne(
        { email: registerDto.email },
        { includePassword: true },
      );

      expect(user).toBeDefined();
      expect(user!.email).toBe(registerDto.email);
      expect((user as any).password).not.toBe(registerDto.password);

      const isPasswordValid = await bcrypt.compare(
        registerDto.password,
        (user as any).password,
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should prevent duplicate email registration', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate Test User',
      };

      await authService.register(registerDto);

      await expect(authService.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );
    });
  });

  describe('User Login Flow', () => {
    it('should login user with valid credentials', async () => {
      const registerDto = {
        email: 'login-test@example.com',
        password: 'password123',
        name: 'Login Test User',
      };

      await authService.register(registerDto);

      const user = await authService.verifyUser(
        registerDto.email,
        registerDto.password,
      );

      expect(user).toBeDefined();
      expect(user.email).toBe(registerDto.email);

      const loginResult = await authService.login(user);

      expect(loginResult).toHaveProperty('accessToken');
      expect(loginResult).toHaveProperty('userId');
      expect(loginResult.userId).toBe(user.id);
    });

    it('should reject login with invalid password', async () => {
      const registerDto = {
        email: 'invalid-password@example.com',
        password: 'password123',
        name: 'Invalid Password Test',
      };

      await authService.register(registerDto);

      await expect(
        authService.verifyUser(registerDto.email, 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        authService.verifyUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('User Service Integration', () => {
    it('should create user and retrieve without password by default', async () => {
      const createDto = {
        email: 'retrieve-test@example.com',
        password: 'password123',
      };

      const createdUser = await userService.create(createDto);

      expect(createdUser).not.toHaveProperty('password');
      expect(createdUser).toHaveProperty('id');
      expect(createdUser).toHaveProperty('email');

      const foundUser = await userService.findOne({ id: createdUser.id });

      expect(foundUser).not.toHaveProperty('password');
      expect(foundUser!.email).toBe(createDto.email);
    });

    it('should retrieve user with password when explicitly requested', async () => {
      const createDto = {
        email: 'with-password@example.com',
        password: 'password123',
      };

      const createdUser = await userService.create(createDto);

      const foundUser = await userService.findOne(
        { id: createdUser.id },
        { includePassword: true },
      );

      expect(foundUser).toHaveProperty('password');
      expect((foundUser as any).password).toBeDefined();
    });

    it('should update user information', async () => {
      const createDto = {
        email: 'update-test@example.com',
        password: 'password123',
      };

      const createdUser = await userService.create(createDto);

      const updatedUser = await userService.update({
        where: { id: createdUser.id },
        data: { email: 'updated@example.com' },
      });

      expect(updatedUser.email).toBe('updated@example.com');
    });

    it('should delete user', async () => {
      const createDto = {
        email: 'delete-test@example.com',
        password: 'password123',
      };

      const createdUser = await userService.create(createDto);

      await userService.delete({ id: createdUser.id });

      const foundUser = await userService.findOne({ id: createdUser.id });
      expect(foundUser).toBeNull();
    });
  });

  describe('Complete Authentication Workflow', () => {
    it('should complete full registration and login cycle', async () => {
      const registerDto = {
        email: 'workflow@example.com',
        password: 'password123',
        name: 'Workflow Test User',
      };

      const registerResult = await authService.register(registerDto);
      expect(registerResult.message).toBeDefined();
      expect(registerResult.userId).toBeDefined();

      const userId = registerResult.userId;

      const user = await userService.findOne({ id: userId });
      expect(user).toBeDefined();
      expect(user!.email).toBe(registerDto.email);

      const verifiedUser = await authService.verifyUser(
        registerDto.email,
        registerDto.password,
      );
      expect(verifiedUser.id).toBe(userId);

      const loginResult = await authService.login(verifiedUser);
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.userId).toBe(userId);
    });

    it('should maintain user data integrity across operations', async () => {
      const registerDto = {
        email: 'integrity@example.com',
        password: 'password123',
        name: 'Integrity Test User',
      };

      const registerResult = await authService.register(registerDto);

      const dbUser = await userService.findOne(
        { id: registerResult.userId },
        { includePassword: true },
      );

      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(registerDto.email);

      const isValid = await bcrypt.compare(
        registerDto.password,
        (dbUser as any).password,
      );
      expect(isValid).toBe(true);

      const verifiedUser = await authService.verifyUser(
        registerDto.email,
        registerDto.password,
      );
      expect(verifiedUser.id).toBe(registerResult.userId);
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in registration response', async () => {
      const registerDto = {
        email: 'security@example.com',
        password: 'password123',
        name: 'Security Test User',
      };

      const result = await authService.register(registerDto);

      expect(result).not.toHaveProperty('password');
    });

    it('should hash different passwords differently', async () => {
      const user1 = await userService.create({
        email: 'user1@example.com',
        password: 'password123',
      });

      const user2 = await userService.create({
        email: 'user2@example.com',
        password: 'password456',
      });

      const user1WithPassword = await userService.findOne(
        { id: user1.id },
        { includePassword: true },
      );

      const user2WithPassword = await userService.findOne(
        { id: user2.id },
        { includePassword: true },
      );

      expect((user1WithPassword as any).password).not.toBe(
        (user2WithPassword as any).password,
      );
    });

    it('should generate unique JWT tokens for different users', async () => {
      await authService.register({
        email: 'jwt1@example.com',
        password: 'password123',
        name: 'JWT Test User 1',
      });

      await authService.register({
        email: 'jwt2@example.com',
        password: 'password123',
        name: 'JWT Test User 2',
      });

      
      const user1 = await authService.verifyUser(
        'jwt1@example.com',
        'password123',
      );
      const user2 = await authService.verifyUser(
        'jwt2@example.com',
        'password123',
      );

      const user1LoginResult = await authService.login(user1);
      const user2LoginResult = await authService.login(user2);

      expect(user1LoginResult.accessToken).not.toBe(
        user2LoginResult.accessToken,
      );
    });
  });
});
