import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DefaultsDaos } from './defaults.daos.js';
import { DefaultsService } from './defaults.service.js';
import { KafkaService } from '../kafka/kafka.service.js';
import { DefaultsController } from './defaults.controller.js';
import { DefaultSchema, DefaultSchemaBase } from './defaults.schema.js';
import { InterceptorMongoDocument } from '../utils/interceptorMongoDocument.service.js';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: DefaultSchemaBase.name,
        useFactory: (
          kafkaService: KafkaService,
          interceptor: InterceptorMongoDocument,
        ) => {
          const schema = DefaultSchema;

          schema.pre('updateOne', async function () {
            return await interceptor.interceptorMongoDocument(this);
          });
          schema.pre('deleteOne', async function () {
            return await interceptor.interceptorMongoDocument(this);
          });
          schema.pre('findOneAndUpdate', async function () {
            return await interceptor.interceptorMongoDocument(this);
          });
          schema.pre('findOneAndDelete', async function () {
            return await interceptor.interceptorMongoDocument(this);
          });

          schema.post('insertMany', (doc: any) => {
            kafkaService.emitTopic('default-insert', doc);
          });
          schema.post('save', (doc: any) =>
            kafkaService.emitTopic('default-insert', doc),
          );
          schema.post('updateOne', (doc: any) => {
            kafkaService.emitTopic('default-update', doc);
          });
          schema.post('updateMany', (doc: any) => {
            kafkaService.emitTopic('default-update', doc);
          });
          schema.post('findOneAndUpdate', (doc: any) =>
            kafkaService.emitTopic('default-update', doc),
          );
          schema.post('findOneAndDelete', (doc: any) =>
            kafkaService.emitTopic('default-delete', doc),
          );
          schema.post('deleteOne', (doc: any) =>
            kafkaService.emitTopic('default-delete', doc),
          );
          schema.post('deleteMany', (doc: any) =>
            kafkaService.emitTopic('default-delete', doc),
          );

          return schema;
        },
        inject: [KafkaService, InterceptorMongoDocument],
      },
    ]),
  ],
  controllers: [DefaultsController],
  providers: [DefaultsDaos, DefaultsService],
})
export class DefaultsModule {}
