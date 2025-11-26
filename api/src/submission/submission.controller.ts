import { Body, Controller, Post } from '@nestjs/common';
import { SubmissionService } from './submission.service';

@Controller('submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}
  @Post()
  create(@Body() body: any) {
    return this.submissionService.create(body);
  }
}
