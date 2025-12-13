import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../generated/prisma';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }
  async validate(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = this.authService.verifyUser(email, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
