import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dtos/create-submission.dto';

@Controller('submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}
  @Post()
  create(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionService.create(createSubmissionDto);
  }
}
