import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { AjvValidatorError } from '@grials/shared-tools';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse() as FastifyReply;

    if (exception instanceof AjvValidatorError) {
      const err = exception as { status?: number; code?: string; errors?: any };

      return response.status(err.status as number).send({
        message: 'Invalid data',
        length: err.errors?.length,
        errors: err.errors,
        code: err.code,
      });
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : String(exception);

    const match = message.match(/\[(.*?)\]/);
    const code = match ? match[1] : '';

    response.status(status).send({ message, code });
  }
}
