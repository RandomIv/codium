import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProblemPreview,
  problemPreviewSelect,
} from './types/problem-preview.type';
import { Problem } from '../generated/prisma';
import { ProblemDetail, problemDetailSelect } from './types/problem-detail.dto';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';

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
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      select: problemDetailSelect,
    });
    if (!problem) {
      throw new NotFoundException(`Problem ${slug} not found`);
    }

    return problem;
  }

  async create(data: CreateProblemDto): Promise<Problem> {
    return this.prisma.problem.create({ data });
  }

  async update(id: string, data: UpdateProblemDto): Promise<Problem> {
    try {
      return await this.prisma.problem.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Problem with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Problem> {
    try {
      return await this.prisma.problem.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Problem with ID ${id} not found`);
      }
      throw error;
    }
  }
}
