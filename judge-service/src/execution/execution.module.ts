import { Module } from '@nestjs/common';
import { ExecutionService } from './docker-execution.service';
import { FileManager } from './managers/file.manager';
import { ContainerManager } from './managers/container.manager';
import { CodeExecutionService } from './services/code-execution.service';
import { ResultCollectorService } from './services/result-collector.service';

@Module({
  providers: [
    ExecutionService,
    FileManager,
    ContainerManager,
    CodeExecutionService,
    ResultCollectorService,
  ],
  exports: [ExecutionService],
})
export class ExecutionModule {}
