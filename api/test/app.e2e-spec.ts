import { INestApplication } from '@nestjs/common';
import { createTestApp, stopTestDbContainer } from './utils/create-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  afterAll(async () => {
    await app.close();
    await stopTestDbContainer();
  });

  it('should start application', () => {
    expect(app).toBeDefined();
  });
});
