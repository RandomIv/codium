import { ContainerConfigBuilder } from './container.config';

describe('ContainerConfigBuilder', () => {
  describe('build', () => {
    const validOptions = {
      image: 'python:3.9-slim-time',
      command: ['/usr/bin/time', '-v', 'python3', 'test.py'],
      workDir: '/app',
      tempDir: '/tmp/codium',
    };

    it('should build valid container config', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.Image).toBe('python:3.9-slim-time');
      expect(config.Cmd).toEqual(['/usr/bin/time', '-v', 'python3', 'test.py']);
      expect(config.WorkingDir).toBe('/app');
    });

    it('should set correct memory limits (512MB)', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.Memory).toBe(512 * 1024 * 1024);
      expect(config.HostConfig?.MemorySwap).toBe(512 * 1024 * 1024);
    });

    it('should disable network', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.NetworkDisabled).toBe(true);
      expect(config.HostConfig?.NetworkMode).toBe('none');
    });

    it('should set TTY to false', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.Tty).toBe(false);
    });

    it('should enable stdin', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.OpenStdin).toBe(true);
      expect(config.StdinOnce).toBe(true);
    });

    it('should bind correct volumes', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.Binds).toEqual(['/tmp/codium:/app:rw']);
    });

    it('should set PID limit to 50', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.PidsLimit).toBe(50);
    });

    it('should set CPU limit to 1 core', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.NanoCpus).toBe(1000000000);
    });

    it('should handle different images', () => {
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        image: 'node:18-slim-time',
      });

      expect(config.Image).toBe('node:18-slim-time');
    });

    it('should handle different commands', () => {
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        command: ['/usr/bin/time', '-v', 'node', 'test.js'],
      });

      expect(config.Cmd).toEqual(['/usr/bin/time', '-v', 'node', 'test.js']);
    });

    it('should handle different work directories', () => {
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        workDir: '/workspace',
      });

      expect(config.WorkingDir).toBe('/workspace');
    });

    it('should handle different temp directories', () => {
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        tempDir: '/var/tmp/judge',
      });

      expect(config.HostConfig?.Binds).toEqual(['/var/tmp/judge:/app:rw']);
    });

    it('should create volume binding with read-write access', () => {
      const config = ContainerConfigBuilder.build(validOptions);
      const binding = config.HostConfig?.Binds?.[0];

      expect(binding).toContain(':rw');
    });

    it('should have exactly one volume binding', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.Binds?.length).toBe(1);
    });

    it('should set memory and swap to same value', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig?.Memory).toBe(config.HostConfig?.MemorySwap);
    });

    it('should create complete HostConfig', () => {
      const config = ContainerConfigBuilder.build(validOptions);

      expect(config.HostConfig).toBeDefined();
      expect(config.HostConfig?.Memory).toBeDefined();
      expect(config.HostConfig?.MemorySwap).toBeDefined();
      expect(config.HostConfig?.NetworkMode).toBeDefined();
      expect(config.HostConfig?.Binds).toBeDefined();
      expect(config.HostConfig?.PidsLimit).toBeDefined();
      expect(config.HostConfig?.NanoCpus).toBeDefined();
    });

    it('should handle paths with spaces in tempDir', () => {
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        tempDir: '/tmp/my submissions',
      });

      expect(config.HostConfig?.Binds?.[0]).toContain('/tmp/my submissions');
    });

    it('should preserve command array order', () => {
      const command = ['first', 'second', 'third', 'fourth'];
      const config = ContainerConfigBuilder.build({
        ...validOptions,
        command,
      });

      expect(config.Cmd).toEqual(command);
    });
  });
});
