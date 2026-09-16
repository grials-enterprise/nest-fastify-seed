import { Observable } from 'rxjs';
import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class HeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const logData = {
      path: req.url ?? req.path, // Fastify usa `url`
      method: req.method,
      originalPath: req.originalUrl ?? req.url,
      language: req.headers['accept-language'],
      appVersion: req.headers['l-api-version'],
      licenseKey: req.headers['licenseKey'],
      authorization: req.headers['authorization'] ?? '',
    };
    (req.headers as any).logData = logData;
    return next.handle();
  }
}
