import * as assert from 'assert';
import { of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggerInterceptor } from '../../src/common/interceptors/logger.interceptor.js';
import { AppConfigService } from '../../src/config/config.service.js';

describe('LoggerInterceptor', () => {
  const config = {
    getUtils: (key: string) =>
      key === 'BALLS'
        ? { yellow: 'y', green: 'g', red: 'r' }
        : undefined,
  } as unknown as AppConfigService;

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/defaults',
        body: undefined,
      }),
    }),
  } as unknown as ExecutionContext;

  it('processes next and returns the data', async () => {
    const next = {
      handle: () => of({ name: 'resp' }),
    } as unknown as CallHandler;

    const interceptor = new LoggerInterceptor(config);
    const result = await lastValueFrom(interceptor.intercept(context, next));

    assert.deepStrictEqual(result, { name: 'resp' });
  });

  it('propagates the error through the error branch', async () => {
    const next = {
      handle: () => throwError(() => new Error('boom')),
    } as unknown as CallHandler;

    const interceptor = new LoggerInterceptor(config);

    await assert.rejects(
      () => lastValueFrom(interceptor.intercept(context, next)),
      /boom/,
    );
  });
});
