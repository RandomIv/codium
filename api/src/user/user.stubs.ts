import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserWithoutPassword } from './types/user-nopass.type';
import { User } from '../generated/prisma';

export const createUserDtoStub: CreateUserDto = {
  email: 'test@example.com',
  password: 'password123',
};

export const updateUserDtoStub: UpdateUserDto = {
  email: 'updated@example.com',
};

export const userWithPasswordStub: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: createUserDtoStub.email,
  password: 'hashedpassword',
  role: 'USER',
  name: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const userWithoutPasswordStub: UserWithoutPassword = {
  id: userWithPasswordStub.id,
  email: userWithPasswordStub.email,
  role: userWithPasswordStub.role,
  name: userWithPasswordStub.name,
  createdAt: userWithPasswordStub.createdAt,
  updatedAt: userWithPasswordStub.updatedAt,
};

export const updatedUserWithoutPasswordStub: UserWithoutPassword = {
  ...userWithoutPasswordStub,
  email: updateUserDtoStub.email!,
  updatedAt: new Date('2024-01-01T00:01:00.000Z'),
};

export const usersArrayStub: UserWithoutPassword[] = [
  userWithoutPasswordStub,
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'user2@example.com',
    role: 'USER',
    name: 'John Doe',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'admin@example.com',
    role: 'ADMIN',
    name: 'Admin User',
    createdAt: new Date('2024-01-03T00:00:00.000Z'),
    updatedAt: new Date('2024-01-03T00:00:00.000Z'),
  },
];
