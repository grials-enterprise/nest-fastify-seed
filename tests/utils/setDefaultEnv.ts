import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export const TEST_EXECUTE = 'ALL';

export const setDefaultEnv = () => {
  const env = JSON.parse(
    fs.readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../env.json'),
      'utf8',
    ) || '{}',
  );

  process.env.TZ = 'UTC';
  process.env.APP_PORT = '3054';
  process.env.HOST = 'localhost';
  process.env.ENVIRONMENT = 'DEV';
  process.env.LOG_LEVEL = 'silent';
  process.env.KAFKA_LOG_LEVEL = '0';
  process.env.KAFKA_ID = 'defaults-api';
  process.env.KAFKA_BROKERS = '127.0.0.1:9092';
  process.env.DB_NAME = 'test';
  process.env.DB_USERNAME = env?.DB_USERNAME || 'admin';
  process.env.DB_PASSWORD = env?.DB_PASSWORD || 'admin';
  process.env.S3_ASSETS_BUCKET = env?.S3_ASSETS_BUCKET || '';
  process.env.AWS_ACCESS_KEY_ID = env?.AWS_ACCESS_KEY_ID || '';
  process.env.AWS_DEFAULT_REGION = env?.AWS_DEFAULT_REGION || '';
  process.env.AWS_SECRET_ACCESS_KEY = env?.AWS_SECRET_ACCESS_KEY || '';
};
