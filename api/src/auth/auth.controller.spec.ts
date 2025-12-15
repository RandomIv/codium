import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import {
  registerUserDtoStub,
  registerUserResponseStub,
  loginUserResponseStub,
  userStub,
  userProfileStub,
} from './auth.stubs';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userService: UserService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockUserService = {
    findUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(registerUserResponseStub);

      const result = await authController.register(registerUserDtoStub);

      expect(authService.register).toHaveBeenCalledWith(registerUserDtoStub);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(registerUserResponseStub);
    });

    it('should return message and user id', async () => {
      mockAuthService.register.mockResolvedValue(registerUserResponseStub);

      const result = await authController.register(registerUserDtoStub);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
      expect(result.message).toBe(registerUserResponseStub.message);
      expect(result.userId).toBe(registerUserResponseStub.userId);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        authController.register(registerUserDtoStub),
      ).rejects.toThrow(ConflictException);
      await expect(
        authController.register(registerUserDtoStub),
      ).rejects.toThrow('Email already registered');

      expect(authService.register).toHaveBeenCalledWith(registerUserDtoStub);
    });

    it('should pass user data to auth service', async () => {
      mockAuthService.register.mockResolvedValue(registerUserResponseStub);

      await authController.register(registerUserDtoStub);

      const registerCall = mockAuthService.register.mock.calls[0];
      expect(registerCall[0]).toEqual(registerUserDtoStub);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(loginUserResponseStub);

      const result = await authController.login(userStub);

      expect(authService.login).toHaveBeenCalledWith(userStub);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(loginUserResponseStub);
    });

    it('should return access token and user id', async () => {
      mockAuthService.login.mockResolvedValue(loginUserResponseStub);

      const result = await authController.login(userStub);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('userId');
      expect(result.accessToken).toBe(loginUserResponseStub.accessToken);
      expect(result.userId).toBe(loginUserResponseStub.userId);
    });

    it('should pass full user object to auth service', async () => {
      mockAuthService.login.mockResolvedValue(loginUserResponseStub);

      await authController.login(userStub);

      const loginCall = mockAuthService.login.mock.calls[0];
      expect(loginCall[0]).toBe(userStub);
    });

    it('should handle login service errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Login failed'));

      await expect(authController.login(userStub)).rejects.toThrow(
        'Login failed',
      );
      expect(authService.login).toHaveBeenCalledWith(userStub);
    });
  });

  describe('getMe', () => {
    it('should get current user profile successfully', async () => {
      mockUserService.findUserProfile.mockResolvedValue(userProfileStub);

      const result = await authController.getMe(userStub);

      expect(userService.findUserProfile).toHaveBeenCalledWith(userStub.id);
      expect(userService.findUserProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(userProfileStub);
    });

    it('should return user profile with submissions', async () => {
      mockUserService.findUserProfile.mockResolvedValue(userProfileStub);

      const result = await authController.getMe(userStub);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('submissions');
      expect(result.id).toBe(userStub.id);
    });

    it('should pass user id to user service', async () => {
      mockUserService.findUserProfile.mockResolvedValue(userProfileStub);

      await authController.getMe(userStub);

      const findUserProfileCall = mockUserService.findUserProfile.mock.calls[0];
      expect(findUserProfileCall[0]).toBe(userStub.id);
    });

    it('should handle user service errors', async () => {
      mockUserService.findUserProfile.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(authController.getMe(userStub)).rejects.toThrow(
        'User not found',
      );
      expect(userService.findUserProfile).toHaveBeenCalledWith(userStub.id);
    });

    it('should not expose password in profile', async () => {
      mockUserService.findUserProfile.mockResolvedValue(userProfileStub);

      const result = await authController.getMe(userStub);

      expect(result).not.toHaveProperty('password');
    });
  });
});
