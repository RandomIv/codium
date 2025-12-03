import { IsNotEmpty, IsString } from 'class-validator';
export class CreateProblemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
