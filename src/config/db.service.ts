import * as path from 'path';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Injectable } from '@nestjs/common';
import { IAppConfig } from './configurations.js';
import { AppConfigService } from './config.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface MongoOptions {
  useCreateIndex: boolean;
  useFindAndModify: boolean;
  dbName: string;
  user: string;
  pass: string;
  authSource: string;
}

@Injectable()
export class DbService {
  private mongoOptions: MongoOptions;
  constructor(private readonly AppConfigService: AppConfigService) {
    const config = this.AppConfigService.get<IAppConfig['database']>(
      'database',
    ) as IAppConfig['database'];
    this.mongoOptions = {
      useCreateIndex: true,
      useFindAndModify: false,
      dbName: config.DB_NAME,
      user: config.DB_USERNAME,
      pass: config.DB_PASSWORD,
      authSource: config.DB_NAME,
    };

    if (config.DB_SECURE_SOCKET) {
      this.mongoOptions = {
        ...this.mongoOptions,
        ...{
          ssl: config.DB_SSL,
          sslValidate: config.DB_SSL_VALIDATE,
          sslCA: config.DB_SSL_CA
            ? [readFileSync(path.resolve(__dirname, config.DB_SSL_CA))]
            : undefined,
        },
      };
    }
  }

  mongoUri(provider: 'mongo' | 'atlas'): string | null {
    const config = this.AppConfigService.get<IAppConfig['database']>(
      'database',
    ) as IAppConfig['database'];
    const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = config;
    let uri = null;
    switch (provider) {
      case 'mongo':
        uri = `mongodb://${DB_HOST}:${DB_PORT}`;
        break;
      case 'atlas':
        uri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`;
        break;
    }
    return uri;
  }

  async connect() {
    const config = this.AppConfigService.get<IAppConfig['database']>(
      'database',
    ) as IAppConfig['database'];
    const { DB_PROVIDER } = config;
    await mongoose.connect(
      this.mongoUri(DB_PROVIDER as 'mongo' | 'atlas') as string,
      DB_PROVIDER === 'atlas' ? {} : this.mongoOptions,
    );
  }

  async dbHealth() {
    return mongoose.connection.readyState === 1 ? true : false;
  }

  async disconnect() {
    mongoose.disconnect();
  }
}
