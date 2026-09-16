import { Injectable } from '@nestjs/common';
import { ConfigService as NestJSConfig } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestJSConfig) {}

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(key) ?? defaultValue;
  }

  getApp<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(`app.${key}`) ?? defaultValue;
  }
  getUtils<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(`utils.${key}`) ?? defaultValue;
  }
  getDatabase<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(`database.${key}`) ?? defaultValue;
  }
  getKafka<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(`kafka.${key}`) ?? defaultValue;
  }
  getAws<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get<T>(`aws.${key}`) ?? defaultValue;
  }
}
