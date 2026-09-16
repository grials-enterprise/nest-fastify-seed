import * as assert from 'assert';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { HeaderInterceptor } from '../../src/common/interceptors/header.interceptor.js';

describe('HeaderInterceptor', () => {
  const interceptor = new HeaderInterceptor();

  const makeContext = (req: any) =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as unknown as ExecutionContext;

  const next = { handle: () => of('result') } as unknown as CallHandler;

  it('builds logData from url/originalUrl and returns next.handle()', async () => {
    const req: any = {
      url: '/defaults',
      originalUrl: '/defaults?skip=1',
      method: 'GET',
      headers: {
        'accept-language': 'es',
        'l-api-version': '1.0.0',
        licenseKey: 'lk-1',
        authorization: 'Bearer x',
      },
    };

    const result = await lastValueFrom(
      interceptor.intercept(makeContext(req), next),
    );

    assert.strictEqual(result, 'result');
    assert.strictEqual(req.headers.logData.path, '/defaults');
    assert.strictEqual(req.headers.logData.originalPath, '/defaults?skip=1');
    assert.strictEqual(req.headers.logData.method, 'GET');
    assert.strictEqual(req.headers.logData.language, 'es');
    assert.strictEqual(req.headers.logData.appVersion, '1.0.0');
    assert.strictEqual(req.headers.logData.licenseKey, 'lk-1');
    assert.strictEqual(req.headers.logData.authorization, 'Bearer x');
  });

  it('falls back to req.path and empty authorization', async () => {
    const req: any = {
      path: '/defaults',
      method: 'POST',
      headers: {},
    };

    await lastValueFrom(interceptor.intercept(makeContext(req), next));

    assert.strictEqual(req.headers.logData.path, '/defaults');
    assert.strictEqual(req.headers.logData.originalPath, undefined);
    assert.strictEqual(req.headers.logData.authorization, '');
  });

  it('falls back to req.url for originalPath when originalUrl is missing', async () => {
    const req: any = {
      url: '/defaults',
      method: 'GET',
      headers: {},
    };

    await lastValueFrom(interceptor.intercept(makeContext(req), next));

    assert.strictEqual(req.headers.logData.path, '/defaults');
    assert.strictEqual(req.headers.logData.originalPath, '/defaults');
    assert.strictEqual(req.headers.logData.authorization, '');
  });
});
