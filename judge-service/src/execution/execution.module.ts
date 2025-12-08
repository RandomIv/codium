import { Module } from '@nestjs/common';
import { ExecutionService } from './docker-execution.service';
import { FileManager } from './managers/file.manager';
import { ContainerManager } from './managers/container.manager';
import { CodeExecutionOrchestrator } from './services/code-execution.orchestrator';
import { ResultCollectorService } from './services/result-collector.service';

@Module({
  providers: [
    ExecutionService,
    FileManager,
    ContainerManager,
    CodeExecutionOrchestrator,
    ResultCollectorService,
  ],
  exports: [ExecutionService],
})
export class ExecutionModule {}
