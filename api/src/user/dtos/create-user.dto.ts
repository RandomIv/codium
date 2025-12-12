import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Prisma } from '../../generated/prisma';
export class CreateUserDto implements Prisma.UserCreateInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
