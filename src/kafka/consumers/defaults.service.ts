import {
  Logger,
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Consumer } from 'kafkajs';
import { KafkaService } from '../kafka.service.js';
import { AppConfigService } from '../../config/config.service.js';
import { IAppConfig } from '../../config/configurations.js';

@Injectable()
export class DefaultConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(DefaultConsumerService.name);
  private consumer: Consumer;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly appconfig: AppConfigService,
  ) {}

  async onModuleInit() {
    const BALLS = this.appconfig.getUtils(
      'BALLS',
    ) as IAppConfig['utils']['BALLS'];
    this.logger.debug(`${BALLS.white} init ${DefaultConsumerService.name}`);
    this.consumer = this.kafkaService.client.consumer({
      groupId: 'defaults-group',
    });
    await this.consumer.connect();

    await this.consumer.subscribe({
      topics: [
        this.kafkaService.setTopicEnv('default-insert'),
        this.kafkaService.setTopicEnv('default-update'),
        this.kafkaService.setTopicEnv('default-delete'),
      ],
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const msg = JSON.parse(message?.value?.toString() || '{}');
        this.logger.log(`Listening >> ${topic}`);
        switch (topic) {
          case this.kafkaService.setTopicEnv('default-insert'):
            this.logger.log(`insert received: ${JSON.stringify(msg)}`);
            break;
          case this.kafkaService.setTopicEnv('default-update'):
            this.logger.log(`update received: ${JSON.stringify(msg)}`);
            break;
          case this.kafkaService.setTopicEnv('default-delete'):
            this.logger.log(`delete received: ${JSON.stringify(msg)}`);
            break;
        }
      },
    });

    this.logger.debug(`${BALLS.yellow} ${DefaultConsumerService.name} started`);
  }

  async onApplicationShutdown() {
    await this.consumer?.disconnect();
  }
}
