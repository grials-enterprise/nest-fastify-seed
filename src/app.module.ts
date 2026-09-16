import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { DbService } from './config/db.service.js';
import { KafkaModule } from './kafka/kafka.module.js';
import { UtilsModule } from './utils/utils.module.js';
import { HealthModule } from './health/health.module.js';
import { AppConfigModule } from './config/config.module.js';
import { AppConfigService } from './config/config.service.js';
import { DefaultsModule } from './defaults/defaults.module.js';
import { LicenseGuard } from './common/guards/license.guard.js';
import configurations, { IAppConfig } from './config/configurations.js';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor.js';
import { HeaderInterceptor } from './common/interceptors/header.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exeception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // ObserveModule.forRoot({
    //   appKey: 'YOUR_APP_KEY',
    //   appSecret: 'YOUR_APP_SECRET',
    //   serviceId: 'nestjs-seed-mongoose',
    // }),
    KafkaModule,
    UtilsModule,
    HealthModule,
    DefaultsModule,
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService, DbService],
      useFactory: (config: AppConfigService, dbService: DbService) => {
        const { DB_NAME, DB_PROVIDER } = config.get<IAppConfig['database']>(
          'database',
        ) as IAppConfig['database'];
        const uri = dbService.mongoUri(DB_PROVIDER) as string;

        return { uri, dbName: DB_NAME };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configurations],
    }),
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HeaderInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: LicenseGuard },
  ],
})
export class AppModule {}
