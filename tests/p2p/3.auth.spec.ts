import * as assert from 'assert';
import { api } from '../setup.js';

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

describe('/defaults (authentication)', function () {
  this.timeout(20000);

  it('allows request without authorization', async () => {
    const res = await api
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
  });

  it('allows non-Bearer scheme (Basic)', async () => {
    const res = await api
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', 'Basic abc');

    assert.strictEqual(res.status, 200);
  });

  it('Active bearer on GET is allowed', async () => {
    const res = await api
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${active}`);

    assert.strictEqual(res.status, 200);
  });

  it('Active bearer on POST creates the default', async () => {
    const res = await api
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${active}`)
      .send({ name: 'auth', text: 'hello' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.name, 'auth');
  });

  it('Cancelled bearer on POST is rejected with 403', async () => {
    const res = await api
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${cancelled}`)
      .send({ name: 'x', text: 'hello' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'AU001');
  });

  it('Cancelled bearer on GET is allowed', async () => {
    const res = await api
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .set('authorization', `Bearer ${cancelled}`);

    assert.strictEqual(res.status, 200);
  });
});
