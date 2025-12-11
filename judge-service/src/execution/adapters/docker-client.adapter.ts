import Docker from 'dockerode';
import {
  IContainer,
  IDockerClient,
} from '../interfaces/docker-client.interface';

export class DockerClientAdapter implements IDockerClient {
  constructor(private readonly docker: Docker) {}

  async createContainer(
    options: Docker.ContainerCreateOptions,
  ): Promise<IContainer> {
    return (await this.docker.createContainer(options)) as IContainer;
  }
}
