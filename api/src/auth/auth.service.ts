import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { RegisterUserResponse } from './types/register-response.type';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './types/token-payload.type';
import { LoginUserResponse } from './types/login-response.type';
import * as bcrypt from 'bcrypt';
import { User } from '../generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto): Promise<RegisterUserResponse> {
    const existingUser = await this.userService.findOne({
      email: dto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const newUser = await this.userService.create(dto);

    return {
      message: 'User registered successfully. Please login.',
      userId: newUser.id,
    };
  }

  async verifyUser(email: string, password: string): Promise<User> {
    const user = (await this.userService.findOne(
      { email },
      { includePassword: true },
    )) as User;

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: User): Promise<LoginUserResponse> {
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role,
      name: user.name ?? '',
      email: user.email,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'User login successfully',
      accessToken: token,
      userId: payload.sub,
    };
  }
}
