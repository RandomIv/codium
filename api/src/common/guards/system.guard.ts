import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-system-api-key'];
    const systemApiKey = this.configService.get('SYSTEM_API_KEY');
    if (!apiKey || apiKey !== systemApiKey)
      throw new UnauthorizedException('Access denied: Invalid system key');
    return true;
  }
}
