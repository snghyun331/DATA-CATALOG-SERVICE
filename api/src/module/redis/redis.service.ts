import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getValues(key: string): Promise<string | null> {
    const raw: string = await this.redis.get(key);
    if (!raw) return null;

    const values = JSON.parse(raw);

    return values;
  }

  async setValues(key: string, value: any, ttlSeconds: number) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);

    return;
  }

  /* 단일/복수 키 삭제  */
  async delKeys(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];

    if (list.length === 0) return;
    await this.redis.del(...list);

    return;
  }
}
