import * as assert from 'assert';
import { api } from '../setup.js';

describe('health and root', function () {
  this.timeout(20000);

  it('GET /health responds ok', async () => {
    const res = await api.get('/health').set('l-api-version', '1.0.0');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'OK');
    assert.strictEqual(res.body.data.status, 'ok');
  });
});
