import request from 'supertest';
import { Test } from '@nestjs/testing';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module.js';
import { setDefaultEnv } from './utils/setDefaultEnv.js';
import { startContainer } from './containers/startContainers.js';
import { stopContainer } from './containers/stopContainers.js';

export let api: any;
export let app: NestFastifyApplication;

before(async function () {
  this.timeout(60000);

  await startContainer(); // 1) Kafka (testcontainers)
  setDefaultEnv(); // 2) base env

  // 3) In-memory Mongo, pointing the app config to it
  const mongo = await MongoMemoryServer.create();
  const url = new URL(mongo.getUri());
  process.env.DB_PROVIDER = 'mongo';
  process.env.DB_HOST = url.hostname;
  process.env.DB_PORT = url.port;

  // 4) Boot the REAL app (full AppModule, no overrides)
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  // 5) Replicate main.ts (prefix + versioning)
  app.setGlobalPrefix(`${process.env.APP_NAME ?? 'defaults-service'}/api`, {
    exclude: ['health', 'defaults-service/defaults-docs'],
  });
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'l-api-version',
    defaultVersion: '1.0.0',
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  api = request(app.getHttpServer());
});

after(async function () {
  this.timeout(20000);
  await app.close();
  await stopContainer();
});
