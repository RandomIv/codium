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
  async register(user: RegisterUserDto): Promise<RegisterUserResponse> {
    const existingUser = await this.userService.findOne({
      email: user.email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const newUser = await this.userService.create(user);
    const payload = { sub: newUser.id };
    const token = this.jwtService.sign(payload);
    return {
      message: 'User registered successfully',
      accessToken: token,
      userId: payload.sub,
    };
  }
  async verifyUser(email: string, password: string): Promise<User> {
    const user = (await this.userService.findOne(
      { email },
      { includePassword: true },
    )) as User;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
  async login(id: string): Promise<LoginUserResponse> {
    const payload: TokenPayload = {
      sub: id,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'User login successfully',
      accessToken: token,
      userId: payload.sub,
    };
  }
}
