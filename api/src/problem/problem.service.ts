import { Injectable } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ProblemPreview } from './types/problem-preview.type';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProblemPreview[]> {
    return this.prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} problem`;
  }

  create(createProblemDto: CreateProblemDto) {
    return 'This action adds a new problem';
  }

  update(id: string, updateProblemDto: UpdateProblemDto) {
    return `This action updates a #${id} problem`;
  }

  remove(id: string) {
    return `This action removes a #${id} problem`;
  }
}
