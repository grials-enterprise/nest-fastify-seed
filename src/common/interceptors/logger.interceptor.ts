import {
  Logger,
  Injectable,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppConfigService } from '../../config/config.service.js';
import { IAppConfig } from '../../config/configurations.js';
import { FastifyRequest } from 'fastify';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly appConfigService: AppConfigService) {}

  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const BALLS = this.appConfigService.getUtils(
      'BALLS',
    ) as IAppConfig['utils']['BALLS'];
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const start = Date.now();
    const requestSize = this.sizeOf(request.body);

    this.logger.debug(
      `${BALLS.yellow}IN ${method} ${url} | body: ${requestSize}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - start;
          const responseSize = this.sizeOf(data);
          this.logger.debug(
            `${BALLS.green}OUT ${method} ${url} | ${duration}ms | size: ${responseSize}`,
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.debug(
            `${BALLS.red}ERR ${method} ${url} | ${duration}ms | ${err.message}`,
          );
        },
      }),
    );
  }

  private sizeOf(data: any): string {
    const bytes = Buffer.byteLength(JSON.stringify(data ?? {}), 'utf8');
    return this.formatBytes(bytes);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }
}
