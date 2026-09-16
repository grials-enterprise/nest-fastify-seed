import * as assert from 'assert';
import { api } from '../setup.js';

describe('/defaults (errors)', function () {
  this.timeout(20000);

  it('rejects invalid body with 422', async () => {
    const res = await api
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .send({ name: 'no text' });

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.message, 'Invalid data');
    assert.strictEqual(res.body.code, 'ISV001');
  });

  it('rejects invalid id with 400', async () => {
    const res = await api
      .get('/defaults-service/api/defaults/not-an-id')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'II000');
  });

  it('returns 404 for an unknown route', async () => {
    const res = await api
      .get('/defaults-service/api/unknown')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 404);
  });
});
