import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'})],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
