import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExecutionModule } from '../src/execution/execution.module';
import { ConfigModule } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [ExecutionModule, ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
