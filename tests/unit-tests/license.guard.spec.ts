import * as assert from 'assert';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { LicenseGuard } from '../../src/common/guards/license.guard.js';

const makeToken = (payload: object) => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

const activePayload = {
  licenseKey: 'lk-1',
  licenseStatus: 'active',
  _id: 'u1',
  email: 'a@b.c',
};

const cancelledPayload = {
  licenseKey: 'lk-2',
  licenseStatus: 'cancelled',
  _id: 'u2',
  email: 'x@y.z',
};

describe('LicenseGuard', () => {
  const guard = new LicenseGuard();

  const makeContext = (headers: any, method = 'GET', query: any = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers, method, query }),
      }),
    }) as unknown as ExecutionContext;

  it('allows anonymous request (without authorization)', () => {
    assert.strictEqual(guard.canActivate(makeContext({})), true);
  });

  it('allows when the bearer is not "Bearer"', () => {
    assert.strictEqual(
      guard.canActivate(makeContext({ authorization: 'Basic abc' })),
      true,
    );
  });

  it('Active bearer on GET sets licenseKey and logQuery', () => {
    const req = {
      headers: { authorization: `Bearer ${makeToken(activePayload)}` },
      method: 'GET',
      query: { skip: 1 },
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    assert.strictEqual(guard.canActivate(ctx), true);
    assert.strictEqual(req.headers['licenseKey'], 'lk-1');
    assert.deepStrictEqual(req.logQuery, { skip: 1 });
  });

  it('Active bearer on POST sets logData', () => {
    const req = {
      headers: { authorization: `Bearer ${makeToken(activePayload)}` },
      method: 'POST',
      query: {},
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    assert.strictEqual(guard.canActivate(ctx), true);
    assert.strictEqual((req.headers as any).logData.licenseKey, 'lk-1');
    assert.strictEqual((req.headers as any).logData._user.userId, 'u1');
  });

  it('Active bearer on PATCH sets logData', () => {
    const req = {
      headers: { authorization: `Bearer ${makeToken(activePayload)}` },
      method: 'PATCH',
      query: {},
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    assert.strictEqual(guard.canActivate(ctx), true);
    assert.strictEqual((req.headers as any).logData.licenseKey, 'lk-1');
  });

  it('Cancelled bearer on POST throws ForbiddenException', () => {
    const ctx = makeContext(
      { authorization: `Bearer ${makeToken(cancelledPayload)}` },
      'POST',
    );
    assert.throws(
      () => guard.canActivate(ctx),
      (err: unknown) =>
        err instanceof ForbiddenException && err.getStatus() === 403,
    );
  });

  it('Cancelled bearer on GET is allowed', () => {
    assert.strictEqual(
      guard.canActivate(
        makeContext(
          { authorization: `Bearer ${makeToken(cancelledPayload)}` },
          'GET',
        ),
      ),
      true,
    );
  });
});
