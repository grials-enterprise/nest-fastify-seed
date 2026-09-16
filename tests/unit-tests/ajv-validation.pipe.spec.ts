import * as assert from 'assert';
import { AjvValidationPipe } from '../../src/common/pipes/ajv-validation.pipe.js';

describe('AjvValidationPipe', () => {
  it('returns the value when it satisfies the schema', () => {
    const pipe = AjvValidationPipe('default');
    const value = { text: 'hello' };
    assert.strictEqual(pipe.transform(value), value);
  });

  it('throws an error when the value does not satisfy the schema', () => {
    const pipe = AjvValidationPipe('default');
    assert.throws(() => pipe.transform({ name: 'no text' }));
  });
});
