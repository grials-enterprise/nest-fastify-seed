import * as assert from 'assert';
import { KafkaService } from '../../src/kafka/kafka.service.js';
import { AppConfigService } from '../../src/config/config.service.js';

const makeConfig = (kafka: any, env?: string) =>
  ({
    get: (key: string) => (key === 'kafka' ? kafka : undefined),
    getApp: (key: string) => (key === 'ENVIRONMENT' ? env : undefined),
  }) as unknown as AppConfigService;

describe('KafkaService', () => {
  it('constructor uses defined brokers and logLevel', () => {
    const service = new KafkaService(
      makeConfig({
        KAFKA_ID: 'id',
        KAFKA_BROKERS: ['b:9092'],
        KAFKA_LOG_LEVEL: 0,
      }),
    );
    assert.ok(service.client);
  });

  it('constructor applies fallbacks when there are no brokers nor logLevel', () => {
    const service = new KafkaService(makeConfig({ KAFKA_ID: 'id' }));
    assert.ok(service.client);
  });

  it('setTopicEnv adds prefix with non-prod environment', () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id' }, 'DEV'),
    );
    assert.strictEqual(service.setTopicEnv('topic'), 'DEV-topic');
  });

  it('setTopicEnv does not add prefix in prod', () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id' }, 'prod'),
    );
    assert.strictEqual(service.setTopicEnv('topic'), 'topic');
  });

  it('setTopicEnv does not add prefix when there is no environment', () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id' }, undefined),
    );
    assert.strictEqual(service.setTopicEnv('topic'), 'topic');
  });

  it('onModuleInit creates and connects the producer', async () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id', KAFKA_BROKERS: ['b:9092'] }),
    );
    let connected = false;
    (service.client as any).producer = () => ({
      connect: async () => {
        connected = true;
      },
    });

    await service.onModuleInit();
    assert.strictEqual(connected, true);
  });

  it('onApplicationShutdown disconnects the producer', async () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id', KAFKA_BROKERS: ['b:9092'] }),
    );
    let disconnected = false;
    (service as any).producer = {
      disconnect: async () => {
        disconnected = true;
      },
    };

    await service.onApplicationShutdown();
    assert.strictEqual(disconnected, true);
  });

  it('emitTopic sends the message with _id as key', async () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id', KAFKA_BROKERS: ['b:9092'] }, 'DEV'),
    );
    let sent: any;
    (service as any).producer = {
      send: async (payload: any) => {
        sent = payload;
      },
    };

    await service.emitTopic('default-insert', {
      _id: { toString: () => 'abc' },
      name: 'x',
    });

    assert.strictEqual(sent.topic, 'DEV-default-insert');
    assert.strictEqual(sent.messages[0].key, 'abc');
    assert.strictEqual(
      JSON.parse(sent.messages[0].value).name,
      'x',
    );
  });

  it('emitTopic uses a random key when there is no _id', async () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id', KAFKA_BROKERS: ['b:9092'] }, 'DEV'),
    );
    let sent: any;
    (service as any).producer = {
      send: async (payload: any) => {
        sent = payload;
      },
    };

    await service.emitTopic('default-insert', { name: 'x' });

    assert.ok(typeof sent.messages[0].key === 'string');
  });

  it('emitTopic catches producer errors', async () => {
    const service = new KafkaService(
      makeConfig({ KAFKA_ID: 'id', KAFKA_BROKERS: ['b:9092'] }, 'DEV'),
    );
    (service as any).producer = {
      send: async () => {
        throw new Error('kafka down');
      },
    };

    await service.emitTopic('default-insert', { name: 'x' });
  });
});
