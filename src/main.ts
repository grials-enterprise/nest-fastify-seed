import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
// import {ValidationPipe, } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/config.service.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IAppConfig } from './config/configurations.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 52428800 }), // 50MB
  );

  const config = app.get(AppConfigService);
  const appName = config.getApp<string>('APP_NAME');
  const appPort = config.getApp<number>('APP_PORT') as number;
  const { maxFieldsSize } = config.getAws(
    'UPLOAD_CONFIG',
  ) as IAppConfig['aws']['UPLOAD_CONFIG'];
  const availableVersions = config.getUtils(
    'AVAILABLE_VERSIONS',
  ) as IAppConfig['utils']['AVAILABLE_VERSIONS'];

  // Global API path
  app.setGlobalPrefix(`${appName}/api`, {
    exclude: ['health', `${appName}/defaults-docs`],
  });

  // Versions Manager
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'l-api-version',
    defaultVersion: availableVersions[0],
  });

  // Global Validations by class
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DEFAULT API')
    .setDescription('PEGASI MED Default API microservice')
    .setVersion(availableVersions[0])
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${appName}/defaults-docs`, app, document);

  // Plugins
  await app.register(import('@fastify/cors'), { origin: true });
  await app.register(import('@fastify/helmet'));
  await app.register(import('@fastify/compress'));
  await app.register(import('@fastify/cookie'));
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: maxFieldsSize },
  });

  await app.listen(appPort);
}

await bootstrap();
