import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service.js';
import { DefaultConsumerService } from './consumers/defaults.service.js';

@Global()
@Module({
  providers: [KafkaService, DefaultConsumerService],
  exports: [KafkaService],
})
export class KafkaModule {}
