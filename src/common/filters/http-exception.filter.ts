
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let error = exception.name;

    const payload = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? { ...exceptionResponse }
      : {};

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || exception.message;
      error = (exceptionResponse as any).error || exception.name;
      delete (payload as any).message;
      delete (payload as any).error;
    }

    response
      .status(status)
      .json({
        success: false,
        statusCode: status,
        message: message,
        error: error,
        ...payload,
        timestamp: new Date().toISOString(),
      });
  }
}
