import { NestFactory } from '@nestjs/core';
import { AppModule } from './module/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { WINSTON_CONFIG } from './config/logger.config';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ServerErrorFilter } from './common/filter/exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { validationOptions } from './config/validation.config';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const winstonLogger: LoggerService = WinstonModule.createLogger(WINSTON_CONFIG);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: winstonLogger,
  });

  app.set('trust proxy', true);

  const configService: ConfigService = app.get(ConfigService);
  const SERVER_PORT: number = configService.get<number>('SERVER_PORT');
  const corsOptions: CorsOptions = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  };
  app.enableCors(corsOptions);

  setupSwagger(app);

  app.useGlobalFilters(new ServerErrorFilter(winstonLogger));

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(new ValidationPipe(validationOptions));

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  try {
    await app.listen(SERVER_PORT, '0.0.0.0');
    winstonLogger.log(`✅ Server is running on port ${SERVER_PORT}`);
  } catch (e) {
    winstonLogger.error(e);
    winstonLogger.error('⛔️ Failed to start the app server');
  }
}
bootstrap();
