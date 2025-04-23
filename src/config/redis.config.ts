import { RedisModuleAsyncOptions, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const REDIS_CONFIG: RedisModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<RedisModuleOptions> => ({
    type: 'single',
    url: `${configService.get<string>('REDIS_HOST')}:${configService.get<string>('REDIS_PORT')}`,
  }),
};
