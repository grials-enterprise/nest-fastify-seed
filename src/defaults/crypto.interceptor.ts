import {
  Injectable,
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, mergeMap, Observable } from 'rxjs';
import { AppConfigService } from '../config/config.service.js';

interface ICryptoOptions {
  ENABLED_ENCRYPT?: boolean;
}

const encryptDefaultDocument = async (key: string, data: any) => data;
const decryptDefaultDocument = async (key: string, data: any) => data;

const encryptDoc = async (doc: any, key: string, options?: ICryptoOptions) => {
  // const newDoc = newValueInstance(doc);
  const { ENABLED_ENCRYPT } = options || {};
  const newDoc = doc;
  if (ENABLED_ENCRYPT) {
    return await encryptDefaultDocument(key, newDoc);
  }

  return newDoc;
};

const decryptDoc = async (doc: any, key: string, options?: ICryptoOptions) => {
  // const newDoc = newValueInstance(doc);
  const { ENABLED_ENCRYPT } = options || {};
  const newDoc = doc;
  if (ENABLED_ENCRYPT) {
    return await decryptDefaultDocument(key, newDoc);
  }

  return newDoc;
};

@Injectable()
export class CryptoDefaultsInterceptor implements NestInterceptor {
  constructor(private readonly appConfigService: AppConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const key = request.headers['x-encryption-key'] as string;
    const ENABLED_ENCRYPT = this.appConfigService.getUtils(
      'ENABLED_ENCRYPT',
    ) as boolean;
    const options: ICryptoOptions = {
      ENABLED_ENCRYPT,
    };

    return from(encryptDoc(body, key, options)).pipe(
      mergeMap((encryptedBody) => {
        request.body = encryptedBody;
        return next
          .handle()
          .pipe(mergeMap((data) => decryptDoc(data, key, options)));
      }),
    );
  }
}
