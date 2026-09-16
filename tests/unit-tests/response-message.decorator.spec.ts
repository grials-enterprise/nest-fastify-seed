import * as assert from 'assert';
import { Reflector } from '@nestjs/core';
import {
  RESPONSE_MESSAGE_KEY,
  ResponseMessage,
} from '../../src/common/decorators/response-message.decorator.js';

describe('ResponseMessage', () => {
  it('sets the metadata on the handler with the correct key', () => {
    const fn = () => 'hello';
    const descriptor = {
      value: fn,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    ResponseMessage('defaults list successfully')({}, 'method', descriptor);

    const reflector = new Reflector();
    assert.strictEqual(
      reflector.get(RESPONSE_MESSAGE_KEY, fn),
      'defaults list successfully',
    );
  });
});
