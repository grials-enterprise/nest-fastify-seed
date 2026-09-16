import * as assert from 'assert';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { CryptoDefaultsInterceptor } from '../../src/defaults/crypto.interceptor.js';
import { AppConfigService } from '../../src/config/config.service.js';

describe('CryptoDefaultsInterceptor', () => {
  const makeConfig = (enabled: boolean) =>
    ({
      getUtils: (key: string) => (key === 'ENABLED_ENCRYPT' ? enabled : undefined),
    }) as unknown as AppConfigService;

  const makeContext = (body: any, headers: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ body, headers }),
      }),
    }) as unknown as ExecutionContext;

  const next = { handle: () => of({ name: 'resp' }) } as unknown as CallHandler;

  it('passes the body and response unencrypted when ENABLED_ENCRYPT is false', async () => {
    const body = { name: 'a' };
    const headers = { 'x-encryption-key': 'k' };
    const interceptor = new CryptoDefaultsInterceptor(makeConfig(false));

    const result = await lastValueFrom(
      interceptor.intercept(makeContext(body, headers), next),
    );

    assert.deepStrictEqual(result, { name: 'resp' });
    assert.deepStrictEqual(body, { name: 'a' });
  });

  it('covers the encryption branch when ENABLED_ENCRYPT is true', async () => {
    const body = { name: 'a', text: 'x' };
    const headers = { 'x-encryption-key': 'k' };
    const interceptor = new CryptoDefaultsInterceptor(makeConfig(true));

    const result = await lastValueFrom(
      interceptor.intercept(makeContext(body, headers), next),
    );

    assert.deepStrictEqual(result, { name: 'resp' });
  });
});
