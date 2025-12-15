import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { UpdateSubmissionDto } from './dtos/update-submission.dto';
import { SystemGuard } from '../common/guards/system.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../generated/prisma';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.submissionService.create({
      ...createSubmissionDto,
      userId: user.id,
    });
  }
  @Patch(':id')
  @UseGuards(SystemGuard)
  patch(
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Param('id') id: string,
  ) {
    return this.submissionService.update(id, updateSubmissionDto);
  }
}
