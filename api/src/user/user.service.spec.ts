import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma';
import {
  createUserDtoStub,
  updateUserDtoStub,
  userWithoutPasswordStub,
  userWithPasswordStub,
  updatedUserWithoutPasswordStub,
  usersArrayStub,
} from './user.stubs';

jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
  });

  describe('create', () => {
    it('should create a user with hashed password and return without password', async () => {
      mockPrismaService.user.create.mockResolvedValue(userWithoutPasswordStub);

      const result = await userService.create(createUserDtoStub);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDtoStub.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDtoStub,
          password: 'hashedpassword',
        },
        omit: { password: true },
      });
      expect(result).toEqual(userWithoutPasswordStub);
    });

    it('should hash password before storing', async () => {
      mockPrismaService.user.create.mockResolvedValue(userWithoutPasswordStub);

      await userService.create(createUserDtoStub);

      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDtoStub.password, 10);
    });
  });

  describe('findOne', () => {
    it('should find a user without password by default', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithoutPasswordStub,
      );

      const result = await userService.findOne({
        id: userWithoutPasswordStub.id,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userWithoutPasswordStub.id },
        omit: { password: true },
      });
      expect(result).toEqual(userWithoutPasswordStub);
    });

    it('should find a user with password when includePassword is true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userWithPasswordStub);

      const result = await userService.findOne(
        { id: userWithPasswordStub.id },
        { includePassword: true },
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userWithPasswordStub.id },
      });
      expect(result).toEqual(userWithPasswordStub);
    });

    it('should return null when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await userService.findOne({ id: 'non-existent-id' });

      expect(result).toBeNull();
    });

    it('should find a user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithoutPasswordStub,
      );

      const result = await userService.findOne({
        email: userWithoutPasswordStub.email,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: userWithoutPasswordStub.email },
        omit: { password: true },
      });
      expect(result).toEqual(userWithoutPasswordStub);
    });
  });

  describe('findMany', () => {
    it('should find many users without passwords', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(usersArrayStub);

      const params = {
        where: { name: { contains: 'Test' } } as Prisma.UserWhereInput,
        orderBy: { createdAt: 'desc' } as Prisma.UserOrderByWithRelationInput,
        take: 10,
        skip: 0,
      };

      const result = await userService.findMany(params);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: params.where,
        orderBy: params.orderBy,
        take: params.take,
        skip: params.skip,
        omit: { password: true },
      });
      expect(result).toEqual(usersArrayStub);
    });

    it('should find all users when no filters provided', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(usersArrayStub);

      const result = await userService.findMany({});

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: undefined,
        take: undefined,
        skip: undefined,
        omit: { password: true },
      });
      expect(result).toEqual(usersArrayStub);
    });

    it('should support pagination', async () => {
      const paginatedUsers = [usersArrayStub[0]];
      mockPrismaService.user.findMany.mockResolvedValue(paginatedUsers);

      const result = await userService.findMany({
        take: 1,
        skip: 0,
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: undefined,
        take: 1,
        skip: 0,
        omit: { password: true },
      });
      expect(result).toEqual(paginatedUsers);
    });

    it('should support filtering by role', async () => {
      const adminUsers = usersArrayStub.filter((u) => u.role === 'ADMIN');
      mockPrismaService.user.findMany.mockResolvedValue(adminUsers);

      const result = await userService.findMany({
        where: { role: 'ADMIN' },
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN' },
        orderBy: undefined,
        take: undefined,
        skip: undefined,
        omit: { password: true },
      });
      expect(result).toEqual(adminUsers);
    });
  });

  describe('update', () => {
    it('should update a user and return without password', async () => {
      mockPrismaService.user.update.mockResolvedValue(
        updatedUserWithoutPasswordStub,
      );

      const params = {
        where: {
          id: userWithoutPasswordStub.id,
        } as Prisma.UserWhereUniqueInput,
        data: updateUserDtoStub,
      };

      const result = await userService.update(params);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: params.where,
        data: params.data,
        omit: { password: true },
      });
      expect(result).toEqual(updatedUserWithoutPasswordStub);
    });

    it('should update user email', async () => {
      const updatedUser = {
        ...userWithoutPasswordStub,
        email: 'newemail@example.com',
      };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await userService.update({
        where: { id: userWithoutPasswordStub.id },
        data: { email: 'newemail@example.com' },
      });

      expect(result.email).toBe('newemail@example.com');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockPrismaService.user.delete.mockResolvedValue(userWithPasswordStub);

      await userService.delete({ id: userWithoutPasswordStub.id });

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userWithoutPasswordStub.id },
      });
    });

    it('should delete a user by email', async () => {
      mockPrismaService.user.delete.mockResolvedValue(userWithPasswordStub);

      await userService.delete({ email: userWithoutPasswordStub.email });

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { email: userWithoutPasswordStub.email },
      });
    });

    it('should not return any value', async () => {
      mockPrismaService.user.delete.mockResolvedValue(userWithPasswordStub);

      const result = await userService.delete({
        id: userWithoutPasswordStub.id,
      });

      expect(result).toBeUndefined();
    });
  });
});
