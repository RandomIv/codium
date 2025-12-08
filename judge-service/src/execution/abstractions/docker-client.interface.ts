import Docker from 'dockerode';

export interface IContainer {
  start(): Promise<void>;
  wait(): Promise<any>;
  kill(): Promise<void>;
  remove(options?: { force: boolean }): Promise<void>;
  attach(
    options: Docker.ContainerAttachOptions,
  ): Promise<NodeJS.ReadWriteStream>;
  logs(
    options: Docker.ContainerLogsOptions,
  ): Promise<Buffer | NodeJS.ReadableStream>;
  inspect(): Promise<Docker.ContainerInspectInfo>;
}

export interface IDockerClient {
  createContainer(options: Docker.ContainerCreateOptions): Promise<IContainer>;
}

export class DockerClientAdapter implements IDockerClient {
  constructor(private readonly docker: Docker) {}

  async createContainer(
    options: Docker.ContainerCreateOptions,
  ): Promise<IContainer> {
    return (await this.docker.createContainer(options)) as IContainer;
  }
}
