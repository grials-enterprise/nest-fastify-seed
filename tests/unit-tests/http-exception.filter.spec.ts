import * as assert from 'assert';
import { HttpException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AjvValidatorError } from '@grials/shared-tools';
import { HttpExceptionFilter } from '../../src/common/filters/http-exeception.filter.js';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const run = (exception: unknown) => {
    let statusCode = 0;
    let jsonBody: any;
    const response = {
      status: (code: number) => {
        statusCode = code;
        return {
          send: (body: any) => {
            jsonBody = body;
            return body;
          },
        };
      },
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);
    return { statusCode, jsonBody };
  };

  it('handles AjvValidatorError', () => {
    const err = new (AjvValidatorError as any)(
      [{ message: 'bad' }],
      422,
      '[ISV001]: invalid schema default',
    );
    const { statusCode, jsonBody } = run(err);

    assert.strictEqual(statusCode, 422);
    assert.strictEqual(jsonBody.message, 'Invalid data');
    assert.strictEqual(jsonBody.length, 1);
    assert.strictEqual(jsonBody.code, 'ISV001');
  });

  it('handles HttpException extracting the code', () => {
    const { statusCode, jsonBody } = run(
      new HttpException('unauthorized access [AU001]', 403),
    );

    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonBody.message, 'unauthorized access [AU001]');
    assert.strictEqual(jsonBody.code, 'AU001');
  });

  it('handles HttpException without code', () => {
    const { statusCode, jsonBody } = run(new HttpException('nope', 400));

    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonBody.code, '');
  });

  it('handles a generic Error as 500', () => {
    const { statusCode, jsonBody } = run(new Error('boom'));

    assert.strictEqual(statusCode, 500);
    assert.strictEqual(jsonBody.message, 'boom');
    assert.strictEqual(jsonBody.code, '');
  });

  it('extracts the code from a generic Error', () => {
    const { jsonBody } = run(new Error('something [XX01] failed'));
    assert.strictEqual(jsonBody.code, 'XX01');
  });

  it('handles a non-Error value', () => {
    const { statusCode, jsonBody } = run('plain string');

    assert.strictEqual(statusCode, 500);
    assert.strictEqual(jsonBody.message, 'plain string');
  });
});
