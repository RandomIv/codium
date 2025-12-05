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

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.submissionService.findOne(id);
  }
  @Post()
  create(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionService.create(createSubmissionDto);
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
