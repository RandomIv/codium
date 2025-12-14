import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import {
  registerUserDtoStub,
  userStub,
  jwtTokenStub,
  registerUserResponseStub,
  loginUserResponseStub,
  existingUserStub,
  tokenPayloadStub,
} from './auth.stubs';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userWithoutPassword = { ...userStub };
      delete (userWithoutPassword as any).password;

      mockUserService.findOne.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(userWithoutPassword);

      const result = await authService.register(registerUserDtoStub);

      expect(userService.findOne).toHaveBeenCalledWith({
        email: registerUserDtoStub.email,
      });
      expect(userService.create).toHaveBeenCalledWith(registerUserDtoStub);
      expect(result).toEqual(registerUserResponseStub);
    });

    it('should throw ConflictException when user already exists', async () => {
      mockUserService.findOne.mockResolvedValue(existingUserStub);

      await expect(authService.register(registerUserDtoStub)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.register(registerUserDtoStub)).rejects.toThrow(
        'Email already registered',
      );

      expect(userService.findOne).toHaveBeenCalledWith({
        email: registerUserDtoStub.email,
      });
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should check for existing user before creating', async () => {
      mockUserService.findOne.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(userStub);

      await authService.register(registerUserDtoStub);

      const findOneCall = mockUserService.findOne.mock.calls[0];
      expect(findOneCall).toBeDefined();
      expect(findOneCall[0]).toEqual({ email: registerUserDtoStub.email });
    });

    it('should return user id in response', async () => {
      mockUserService.findOne.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(userStub);

      const result = await authService.register(registerUserDtoStub);

      expect(result.userId).toBe(userStub.id);
    });
  });

  describe('verifyUser', () => {
    it('should verify user with valid credentials', async () => {
      mockUserService.findOne.mockResolvedValue(userStub);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.verifyUser(
        registerUserDtoStub.email,
        registerUserDtoStub.password,
      );

      expect(userService.findOne).toHaveBeenCalledWith(
        { email: registerUserDtoStub.email },
        { includePassword: true },
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        registerUserDtoStub.password,
        userStub.password,
      );
      expect(result).toEqual(userStub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(
        authService.verifyUser(
          registerUserDtoStub.email,
          registerUserDtoStub.password,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.verifyUser(
          registerUserDtoStub.email,
          registerUserDtoStub.password,
        ),
      ).rejects.toThrow('Invalid credentials');

      expect(userService.findOne).toHaveBeenCalledWith(
        { email: registerUserDtoStub.email },
        { includePassword: true },
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserService.findOne.mockResolvedValue(userStub);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.verifyUser(
          registerUserDtoStub.email,
          registerUserDtoStub.password,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.verifyUser(
          registerUserDtoStub.email,
          registerUserDtoStub.password,
        ),
      ).rejects.toThrow('Invalid credentials');

      expect(userService.findOne).toHaveBeenCalledWith(
        { email: registerUserDtoStub.email },
        { includePassword: true },
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        registerUserDtoStub.password,
        userStub.password,
      );
    });

    it('should request user with password included', async () => {
      mockUserService.findOne.mockResolvedValue(userStub);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await authService.verifyUser(
        registerUserDtoStub.email,
        registerUserDtoStub.password,
      );

      const findOneCall = mockUserService.findOne.mock.calls[0];
      expect(findOneCall[1]).toEqual({ includePassword: true });
    });

    it('should return full user object including password', async () => {
      mockUserService.findOne.mockResolvedValue(userStub);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.verifyUser(
        registerUserDtoStub.email,
        registerUserDtoStub.password,
      );

      expect(result).toHaveProperty('password');
      expect(result.password).toBe(userStub.password);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockJwtService.sign.mockReturnValue(jwtTokenStub);

      const result = await authService.login(userStub);

      expect(jwtService.sign).toHaveBeenCalledWith(tokenPayloadStub);
      expect(result).toEqual(loginUserResponseStub);
    });

    it('should generate JWT token with user id as subject', async () => {
      mockJwtService.sign.mockReturnValue(jwtTokenStub);

      await authService.login(userStub);

      const signCall = mockJwtService.sign.mock.calls[0];
      expect(signCall[0]).toEqual(tokenPayloadStub);
    });

    it('should return access token in response', async () => {
      mockJwtService.sign.mockReturnValue(jwtTokenStub);

      const result = await authService.login(userStub);

      expect(result.accessToken).toBe(jwtTokenStub);
    });

    it('should return user id in response', async () => {
      mockJwtService.sign.mockReturnValue(jwtTokenStub);

      const result = await authService.login(userStub);

      expect(result.userId).toBe(userStub.id);
    });

    it('should handle JWT service errors', async () => {
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(authService.login(userStub)).rejects.toThrow(
        'JWT signing failed',
      );
      expect(jwtService.sign).toHaveBeenCalledWith(tokenPayloadStub);
    });
  });
});
