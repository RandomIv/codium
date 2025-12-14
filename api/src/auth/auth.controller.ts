import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '../generated/prisma';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() user: RegisterUserDto) {
    return this.authService.register(user);
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: User) {
    return this.authService.login(user);
  }
}
