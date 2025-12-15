import Docker from 'dockerode';

export interface ContainerConfigOptions {
  image: string;
  command: string[];
  workDir: string;
  tempDir: string;
}

const MB_TO_BYTES = 1024 * 1024;
const MEMORY_LIMIT_MB = 512;
const MEMORY_LIMIT_BYTES = MEMORY_LIMIT_MB * MB_TO_BYTES;
const MAX_PIDS = 50;
const NANO_CPUS_PER_CPU = 1000000000;
const CPU_LIMIT_CORES = 1;
const CPU_LIMIT_NANOCPUS = CPU_LIMIT_CORES * NANO_CPUS_PER_CPU;

export class ContainerConfigBuilder {
  static build(options: ContainerConfigOptions): Docker.ContainerCreateOptions {
    return {
      Image: options.image,
      Cmd: options.command,
      WorkingDir: options.workDir,
      Tty: false,
      OpenStdin: true,
      StdinOnce: true,
      NetworkDisabled: true,
      HostConfig: {
        Memory: MEMORY_LIMIT_BYTES,
        MemorySwap: MEMORY_LIMIT_BYTES,
        NetworkMode: 'none',
        Binds: [`${options.tempDir}:${options.workDir}:rw`],
        PidsLimit: MAX_PIDS,
        NanoCpus: CPU_LIMIT_NANOCPUS,
      },
    };
  }
}
