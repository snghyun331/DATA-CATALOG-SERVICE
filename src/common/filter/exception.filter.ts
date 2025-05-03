import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { QueryFailedError } from 'typeorm';

@Catch(HttpException, QueryFailedError, Error)
export class ServerErrorFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async catch(exception: HttpException | QueryFailedError | Error, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    const clientIp = request.headers['x-forwarded-for'];
    const method: string = request.method;
    const originalUrl: string = request.originalUrl;
    const params = JSON.stringify(request.params);
    const body = JSON.stringify(request.body);
    const query = JSON.stringify(request.query);

    if (request) {
      this.logger.error(
        `${clientIp} ${originalUrl} - ${method}  Params: ${params}, Body: ${body}, Query: ${query} \n ⛔️ ${exception.stack}`,
      );
    }

    let status: number;
    let message: string = '알 수 없는 에러 발생';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const err = exception.getResponse();
      message = typeof err === 'string' ? err : (err as any).message || message;
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '쿼리 장애 발생';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || message;
    }

    const errResponseBody = {
      statusCode: status,
      message,
      path: request.url,
    };

    return response.status(status).json(errResponseBody);
  }
}
