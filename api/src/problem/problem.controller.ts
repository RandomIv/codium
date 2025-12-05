import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { SystemGuard } from '../common/guards/system.guard';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  findAll() {
    return this.problemService.findAll();
  }
  @UseGuards(SystemGuard)
  @Get('system/:id')
  findOneById(@Param('id') id: string) {
    return this.problemService.findOneById(id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemService.findOne(slug);
  }

  @Post()
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemService.create(createProblemDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProblemDto: UpdateProblemDto) {
    return this.problemService.update(id, updateProblemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.problemService.remove(id);
  }
}
