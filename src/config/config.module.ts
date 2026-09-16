import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './config.service.js';
import { DbService } from './db.service.js';

@Global()
@Module({
  providers: [DbService, AppConfigService],
  exports: [DbService, AppConfigService],
})
export class AppConfigModule {}
