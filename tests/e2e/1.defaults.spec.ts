import request from 'supertest';
import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../../src/app.module.js';
import { setDefaultEnv } from '../utils/setDefaultEnv.js';
import { KafkaService } from '../../src/kafka/kafka.service.js';
import { DefaultConsumerService } from '../../src/kafka/consumers/defaults.service.js';

const makeToken = (payload: object) => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

const active = makeToken({
  licenseKey: 'lk-1',
  licenseStatus: 'active',
  _id: 'u1',
  email: 'a@b.c',
});

const cancelled = makeToken({
  licenseKey: 'lk-2',
  licenseStatus: 'cancelled',
  _id: 'u2',
  email: 'x@y.z',
});

describe('Defaults e2e', () => {
  let app: NestFastifyApplication;
  let mongo: MongoMemoryServer;

  before(async () => {
    setDefaultEnv();
    mongo = await MongoMemoryServer.create();
    const url = new URL(mongo.getUri());
    process.env.DB_PROVIDER = 'mongo';
    process.env.DB_HOST = url.hostname;
    process.env.DB_PORT = url.port;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KafkaService)
      .useValue({ emitTopic: async () => {}, setTopicEnv: (t: string) => t })
      .overrideProvider(DefaultConsumerService)
      .useValue({
        onModuleInit: async () => {},
        onApplicationShutdown: async () => {},
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('defaults-service/api', {
      exclude: ['health', 'defaults-service/defaults-docs'],
    });
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: 'l-api-version',
      defaultVersion: '1.0.0',
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  after(async () => {
    await app.close();
    await mongo.stop();
  });

  it('POST /defaults creates a default', async () => {
    const res = await request(app.getHttpServer())
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .send({ name: 'test', text: 'hello' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'default created successfully');
    assert.strictEqual(res.body.data.name, 'test');
  });

  it('GET /defaults lists the defaults', async () => {
    const res = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 1);
  });

  it('GET /defaults/:id gets by id', async () => {
    const list = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');
    const id = list.body.data[0]._id;

    const res = await request(app.getHttpServer())
      .get(`/defaults-service/api/defaults/${id}`)
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.name, 'test');
  });

  it('PATCH /defaults/:id updates', async () => {
    const list = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');
    const id = list.body.data[0]._id;

    const res = await request(app.getHttpServer())
      .patch(`/defaults-service/api/defaults/${id}`)
      .set('l-api-version', '1.0.0')
      .send({ name: 'renamed', text: 'updated' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.name, 'renamed');
  });

  it('PATCH /defaults/:id deactivates and activates', async () => {
    const list = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');
    const id = list.body.data[0]._id;

    const off = await request(app.getHttpServer())
      .patch(`/defaults-service/api/defaults/${id}/deactivate`)
      .set('l-api-version', '1.0.0');
    assert.strictEqual(off.status, 200);
    assert.strictEqual(off.body.data.active, false);

    const on = await request(app.getHttpServer())
      .patch(`/defaults-service/api/defaults/${id}/activate`)
      .set('l-api-version', '1.0.0');
    assert.strictEqual(on.status, 200);
    assert.strictEqual(on.body.data.active, true);
  });

  it('POST with invalid body responds 422', async () => {
    const res = await request(app.getHttpServer())
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .send({ name: 'no text' });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.code, 'ISV001');
  });

  it('GET with invalid id responds 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults/not-valid')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'II000');
  });

  it('Cancelled bearer on POST responds 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${cancelled}`)
      .send({ name: 'x', text: 'hello' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'AU001');
  });

  it('Active bearer on GET is allowed', async () => {
    const res = await request(app.getHttpServer())
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${active}`);

    assert.strictEqual(res.status, 200);
  });

  it('GET /health responds ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'ok');
  });
});
