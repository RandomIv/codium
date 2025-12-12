import Docker from 'dockerode';
import { Container, DockerClient } from '../interfaces/docker-client.interface';

export class DockerClientAdapter implements DockerClient {
  constructor(private readonly docker: Docker) {}

  async createContainer(
    options: Docker.ContainerCreateOptions,
  ): Promise<Container> {
    return (await this.docker.createContainer(options)) as Container;
  }
}
