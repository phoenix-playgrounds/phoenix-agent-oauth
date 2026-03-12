import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

const LOGGER = new Logger('HttpExceptionFilter');

interface ErrorPayload {
  statusCode: number;
  message: string;
  error?: string;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    let statusCode: number;
    let message: string;
    let error: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message?: string | string[] }).message;
        message = Array.isArray(msg) ? msg[0] ?? 'Unknown error' : msg ?? 'Unknown error';
      } else {
        message = typeof res === 'string' ? res : 'Unknown error';
      }
      error = exception.name;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
      LOGGER.error(exception instanceof Error ? exception.message : String(exception));
      if (exception instanceof Error && exception.stack) {
        LOGGER.debug(exception.stack);
      }
    }

    const payload: ErrorPayload = { statusCode, message };
    if (error) payload.error = error;

    reply.status(statusCode).send(payload);
  }
}
