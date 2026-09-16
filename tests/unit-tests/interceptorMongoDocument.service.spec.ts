import * as assert from 'assert';
import { InterceptorMongoDocument } from '../../src/utils/interceptorMongoDocument.service.js';
import { KafkaService } from '../../src/kafka/kafka.service.js';

describe('InterceptorMongoDocument', () => {
  let emitted: any[];
  let service: InterceptorMongoDocument;

  const kafkaMock = {
    emitTopic: async (topic: string, doc: any) => {
      emitted.push([topic, doc]);
    },
  } as unknown as KafkaService;

  const makeContext = (findOneResult: any, filter: any, update: any) => ({
    model: { findOne: async () => findOneResult },
    getFilter: () => filter,
    getUpdate: () => update,
  });

  beforeEach(() => {
    emitted = [];
    service = new InterceptorMongoDocument(kafkaMock);
  });

  it('does nothing when there is no update nor oldPayload', async () => {
    await service.interceptorMongoDocument(makeContext(null, {}, undefined));
    assert.strictEqual(emitted.length, 0);
  });

  it('emits audit-log when oldPayload exists', async () => {
    const old = { _id: '1', name: 'x' };
    await service.interceptorMongoDocument(makeContext(old, {}, undefined));
    assert.deepStrictEqual(emitted, [['audit-log-document-version', old]]);
  });

  it('cleans __v and builds $inc in the update', async () => {
    const update = {
      $set: { __v: 5, name: 'x' },
      $setOnInsert: { __v: 5 },
    };
    await service.interceptorMongoDocument(makeContext(null, {}, update));

    assert.deepStrictEqual(update.$set, { name: 'x' });
    assert.strictEqual(update.$setOnInsert, undefined);
    assert.deepStrictEqual(update.$inc, { __v: 1 });
  });

  it('handles update with __v null and null operators', async () => {
    const update = { __v: null, $set: null, $setOnInsert: null };
    await service.interceptorMongoDocument(makeContext(null, {}, update));

    assert.deepStrictEqual(update.$inc, { __v: 1 });
    assert.strictEqual(update.$set, null);
  });

  it('does not delete $set when the operator __v is null', async () => {
    const update = { $set: { __v: null, name: 'x' } };
    await service.interceptorMongoDocument(makeContext(null, {}, update));

    assert.deepStrictEqual(update.$set, { __v: null, name: 'x' });
    assert.deepStrictEqual(update.$inc, { __v: 1 });
  });

  it('rethrows the error if findOne fails', async () => {
    const ctx = {
      model: {
        findOne: async () => {
          throw new Error('db down');
        },
      },
      getFilter: () => ({}),
      getUpdate: () => undefined,
    };

    await assert.rejects(
      () => service.interceptorMongoDocument(ctx),
      /db down/,
    );
  });
});
