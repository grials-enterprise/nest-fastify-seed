import * as assert from 'assert';
import { api } from '../setup.js';

describe('/defaults (point-to-point)', function () {
  this.timeout(20000);
  let defaultId: string;

  it('creates a default', async () => {
    const res = await api
      .post('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0')
      .send({ name: 'test', text: 'hello' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'default created successfully');
    assert.ok(res.body.data._id);

    defaultId = res.body.data._id;
  });

  it('gets the default by id', async () => {
    const res = await api
      .get(`/defaults-service/api/defaults/${defaultId}`)
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.name, 'test');
  });

  it('lists the defaults', async () => {
    const res = await api
      .get('/defaults-service/api/defaults')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 1);
  });

  it('lists the defaults with skip/limit', async () => {
    const res = await api
      .get('/defaults-service/api/defaults?skip=0&limit=10')
      .set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('updates the default', async () => {
    const res = await api
      .patch(`/defaults-service/api/defaults/${defaultId}`)
      .set('l-api-version', '1.0.0')
      .send({ name: 'renamed', text: 'updated' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'default updated successfully');
    assert.strictEqual(res.body.data.name, 'renamed');
    assert.strictEqual(res.body.data.text, 'updated');
  });

  it('deactivates and activates', async () => {
    const off = await api
      .patch(`/defaults-service/api/defaults/${defaultId}/deactivate`)
      .set('l-api-version', '1.0.0');
    assert.strictEqual(off.status, 200);
    assert.strictEqual(off.body.data.active, false);

    const on = await api
      .patch(`/defaults-service/api/defaults/${defaultId}/activate`)
      .set('l-api-version', '1.0.0');
    assert.strictEqual(on.status, 200);
    assert.strictEqual(on.body.data.active, true);
  });
});
