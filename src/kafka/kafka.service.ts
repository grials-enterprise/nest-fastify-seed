import { Kafka, Producer, logLevel } from 'kafkajs';
import {
  Logger,
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { IAppConfig } from '../config/configurations.js';
import { AppConfigService } from '../config/config.service.js';

@Injectable()
export class KafkaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaService.name);
  private producer: Producer;
  readonly client: Kafka;

  constructor(private readonly appConfigService: AppConfigService) {
    const { KAFKA_ID, KAFKA_BROKERS, KAFKA_LOG_LEVEL } =
      this.appConfigService.get('kafka') as IAppConfig['kafka'];
    this.client = new Kafka({
      clientId: KAFKA_ID,
      brokers: KAFKA_BROKERS ?? [],
      logLevel: KAFKA_LOG_LEVEL ?? logLevel.INFO,
    });
  }

  async onModuleInit() {
    this.producer = this.client.producer();
    await this.producer.connect();
  }

  async onApplicationShutdown() {
    await this.producer?.disconnect();
  }

  setTopicEnv(topic: string): string {
    const env = this.appConfigService.getApp<string>('ENVIRONMENT');
    return env && env !== 'prod' ? `${env}-${topic}` : topic;
  }

  async emitTopic(topic: string, doc: any): Promise<void> {
    try {
      await this.producer.send({
        topic: this.setTopicEnv(topic),
        messages: [
          {
            key: doc?._id?.toString() || Math.random().toString(),
            value: JSON.stringify(doc),
          },
        ],
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
}
