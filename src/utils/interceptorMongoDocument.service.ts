import { Injectable } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service.js';

@Injectable()
export class InterceptorMongoDocument {
  constructor(private readonly kafkaService: KafkaService) {}

  async interceptorMongoDocument(modelContext: any) {
    try {
      const oldPayload = await modelContext.model.findOne(
        modelContext.getFilter(),
      );
      if (oldPayload)
        await this.kafkaService.emitTopic(
          'audit-log-document-version',
          oldPayload,
        );

      const update = modelContext.getUpdate();
      if (update) {
        if (update?.__v !== null) {
          delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
          if (update[key] !== null && update[key]?.__v !== null) {
            delete update[key]?.__v;
            if (Object.keys(update[key] || {}).length === 0) {
              delete update[key];
            }
          }
        }
        update.$inc = update.$inc || {};
        update.$inc.__v = 1;
      }
    } catch (error) {
      throw error;
    }
  }
}
