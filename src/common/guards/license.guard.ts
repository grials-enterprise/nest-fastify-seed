import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class LicenseGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers['authorization'];

    if (!authorization) return true; // no token → anonymous request

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer') return true;

    const payload = jwtDecode(token) as any;
    req.headers['licenseKey'] = payload.licenseKey;

    if (payload.licenseStatus === 'cancelled' && req.method !== 'GET') {
      throw new ForbiddenException('unauthorized access [AU001]');
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      (req.headers as any).logData = {
        ...((req.headers as any)?.logData || {}),
        licenseKey: req.headers['licenseKey'],
        _user: { userId: payload._id, email: payload.email, date: new Date() },
      };
    }

    if (req.method === 'GET') {
      req.logQuery = req.query; // the licenseKey filter is added in the DAO (Module 7)
    }

    return true; // allowed to proceed
  }
}
