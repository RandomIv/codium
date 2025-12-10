import { Injectable } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProblemPreview,
  problemPreviewSelect,
} from './types/problem-preview.type';
import { Problem } from '../generated/prisma';
import { ProblemDetail, problemDetailSelect } from './types/problem-detail.dto';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProblemPreview[]> {
    return this.prisma.problem.findMany({
      select: problemPreviewSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(slug: string): Promise<ProblemDetail> {
    return this.prisma.problem.findUniqueOrThrow({
      where: { slug },
      select: problemDetailSelect,
    });
  }

  async findOneById(id: string): Promise<Problem> {
    return this.prisma.problem.findUniqueOrThrow({
      where: { id },
      include: { testCases: true },
    });
  }

  async create(data: CreateProblemDto): Promise<Problem> {
    return this.prisma.problem.create({ data });
  }

  async update(id: string, data: UpdateProblemDto): Promise<Problem> {
    return this.prisma.problem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Problem> {
    return this.prisma.problem.delete({
      where: { id },
    });
  }
}
