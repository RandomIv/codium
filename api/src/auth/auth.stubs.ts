import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserResponse } from './types/login-response.type';
import { RegisterUserResponse } from './types/register-response.type';
import { TokenPayload } from './types/token-payload.type';
import { User } from '../generated/prisma';

export const registerUserDtoStub: RegisterUserDto = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

export const userStub: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: registerUserDtoStub.email,
  password: '$2b$10$hashedpassword',
  role: 'USER',
  name: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

export const tokenPayloadStub: TokenPayload = {
  sub: userStub.id,
};

export const jwtTokenStub =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const registerUserResponseStub: RegisterUserResponse = {
  message: 'User registered successfully',
  accessToken: jwtTokenStub,
  userId: userStub.id,
};

export const loginUserResponseStub: LoginUserResponse = {
  message: 'User login successfully',
  accessToken: jwtTokenStub,
  userId: userStub.id,
};

export const existingUserStub: User = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'existing@example.com',
  password: '$2b$10$hashedexistingpassword',
  role: 'USER',
  name: 'Existing User',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};
