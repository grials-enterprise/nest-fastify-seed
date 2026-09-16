import { Global, Module } from '@nestjs/common';
import { InterceptorMongoDocument } from './interceptorMongoDocument.service.js';

@Global()
@Module({
  providers: [InterceptorMongoDocument],
  exports: [InterceptorMongoDocument],
})
export class UtilsModule {}
