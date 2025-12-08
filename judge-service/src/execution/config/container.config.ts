import Docker from 'dockerode';

export interface ContainerConfigOptions {
  image: string;
  command: string[];
  workDir: string;
  tempDir: string;
}

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
        Memory: 128 * 1024 * 1024,
        MemorySwap: 128 * 1024 * 1024,
        NetworkMode: 'none',
        Binds: [`${options.tempDir}:${options.workDir}:rw`],
        PidsLimit: 50,
        NanoCpus: 1000000000,
      },
    };
  }
}
