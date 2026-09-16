import * as assert from 'assert';
import { HttpException } from '@nestjs/common';
import { ParseObjectIdPipe } from '../../src/common/pipes/parse-object-id.pipe.js';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('returns the id when it is a valid ObjectId', () => {
    const id = '507f1f77bcf86cd799439011';
    assert.strictEqual(pipe.transform(id), id);
  });

  it('throws HttpException 400 when the id is invalid', () => {
    assert.throws(
      () => pipe.transform('not-valid'),
      (err: unknown) => err instanceof HttpException && err.getStatus() === 400,
    );
  });
});
