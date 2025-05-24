import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';

interface ResponseData {
  statusCode: number;
  message: string | undefined;
  data: any | undefined;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((res) => {
        const response: ResponseData = {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: res.message,
          data: res.data,
        };
        return response;
      }),
    );
  }
}
