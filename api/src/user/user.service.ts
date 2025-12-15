import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserWithoutPassword } from './types/user-nopass.type';
import { Prisma, User } from '../generated/prisma';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FindManyUserDto } from './types/find-many-user.type';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateUserDto): Promise<UserWithoutPassword> {
    return this.prisma.user.create({
      data: {
        ...data,
        password: await bcrypt.hash(data.password, 10),
      },
      omit: { password: true },
    });
  }
  async findOne(
    where: Prisma.UserWhereUniqueInput,
    options?: { includePassword?: boolean },
  ): Promise<User | UserWithoutPassword | null> {
    const includePassword = options?.includePassword ?? false;

    return this.prisma.user.findUnique({
      where,
      ...(includePassword ? {} : { omit: { password: true } }),
    });
  }
  async findUserProfile(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      omit: {
        password: true,
      },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });
  }
  async findMany(params: FindManyUserDto): Promise<UserWithoutPassword[]> {
    const { where, orderBy, take, skip } = params;

    return this.prisma.user.findMany({
      where,
      orderBy,
      take,
      skip,
      omit: { password: true },
    });
  }
  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: UpdateUserDto;
  }): Promise<UserWithoutPassword> {
    const { where, data } = params;
    return this.prisma.user.update({
      where,
      data,
      omit: { password: true },
    });
  }
  async delete(where: Prisma.UserWhereUniqueInput): Promise<void> {
    await this.prisma.user.delete({
      where,
    });
  }
}
