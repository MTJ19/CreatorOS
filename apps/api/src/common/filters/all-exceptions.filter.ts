import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma error mapping
      switch (exception.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Unique constraint failed on the fields: ${(exception.meta?.target as string[])?.join(', ')}`;
          errorCode = 'UNIQUE_CONSTRAINT_FAILED';
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record to update/delete not found.';
          errorCode = 'RECORD_NOT_FOUND';
          break;
        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed.';
          errorCode = 'FOREIGN_KEY_CONSTRAINT_FAILED';
          break;
        default:
          this.logger.error(`Unhandled Prisma Error: ${exception.code}`, exception.message);
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Database request failed';
          errorCode = 'DATABASE_ERROR';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = 'Database validation error';
      errorCode = 'DATABASE_VALIDATION_ERROR';
      this.logger.warn(exception.message);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Unknown error', String(exception));
    }

    const responseBody = {
      statusCode: httpStatus,
      error: errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
