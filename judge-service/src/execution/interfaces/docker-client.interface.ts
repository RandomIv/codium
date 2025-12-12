import Docker from 'dockerode';

export type Container = {
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
};

export type DockerClient = {
  createContainer(options: Docker.ContainerCreateOptions): Promise<Container>;
};
