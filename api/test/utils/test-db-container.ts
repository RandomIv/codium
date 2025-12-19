import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let container: StartedPostgreSqlContainer | null = null;

export const startTestDbContainer = async () => {
  if (container) {
    return container;
  }

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('codium_test')
    .withUsername('test')
    .withPassword('test')
    .withReuse()
    .start();

  const dbUrl = container.getConnectionUri();

  process.env.DATABASE_URL = dbUrl;

  execSync('npx prisma db push --accept-data-loss', {
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
    stdio: 'ignore',
  });

  return container;
};

export const stopTestDbContainer = async () => {
  if (container) {
    await container.stop();
    container = null;
  }
};
