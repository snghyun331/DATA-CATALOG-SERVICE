import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { LoggerMiddleware } from '../common/middleware/logger.middleware';
import { SchedulerModule } from './scheduler/scheduler.module';
import { REDIS_CONFIG } from '../config/redis.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { WINSTON_CONFIG } from '../config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(WINSTON_CONFIG),
    RedisModule.forRootAsync(REDIS_CONFIG),
    SchedulerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
