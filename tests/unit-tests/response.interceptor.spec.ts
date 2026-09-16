import * as assert from 'assert';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor.js';
import { RESPONSE_MESSAGE_KEY } from '../../src/common/decorators/response-message.decorator.js';

describe('ResponseInterceptor', () => {
  const handler = () => 'x';
  const context = { getHandler: () => handler } as unknown as ExecutionContext;
  const next = { handle: () => of({ name: 'a' }) } as unknown as CallHandler;

  it('uses the metadata message when present', async () => {
    const reflector = {
      get: (key: string) =>
        key === RESPONSE_MESSAGE_KEY ? 'custom msg' : undefined,
    } as unknown as Reflector;

    const interceptor = new ResponseInterceptor(reflector);
    const result = await lastValueFrom(interceptor.intercept(context, next));

    assert.deepStrictEqual(result, {
      message: 'custom msg',
      data: { name: 'a' },
      status: 'OK',
    });
  });

  it('uses "OK" by default when there is no metadata', async () => {
    const reflector = {
      get: () => undefined,
    } as unknown as Reflector;

    const interceptor = new ResponseInterceptor(reflector);
    const result = await lastValueFrom(interceptor.intercept(context, next));

    assert.deepStrictEqual(result, {
      message: 'OK',
      data: { name: 'a' },
      status: 'OK',
    });
  });
});
