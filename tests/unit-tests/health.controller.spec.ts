import * as assert from 'assert';
import { HealthController } from '../../src/health/health.controller.js';
import {
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  it('runs the check with mongoose pingCheck', async () => {
    let receivedFns: any;
    const healthMock = {
      check: async (fns: any[]) => {
        receivedFns = fns;
        return { status: 'ok' };
      },
    } as unknown as HealthCheckService;

    const mongooseMock = {
      pingCheck: async (name: string) => ({ [name]: { status: 'up' } }),
    } as unknown as MongooseHealthIndicator;

    const controller = new HealthController(healthMock, mongooseMock);
    const result = await controller.check();

    assert.deepStrictEqual(result, { status: 'ok' });
    assert.strictEqual(receivedFns.length, 1);
    const ping = await receivedFns[0]();
    assert.deepStrictEqual(ping, { mongodb: { status: 'up' } });
  });
});
