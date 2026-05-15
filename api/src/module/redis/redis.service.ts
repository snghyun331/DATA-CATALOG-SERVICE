import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getValues(key: string): Promise<string | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;

      const values = JSON.parse(raw);

      return values;
    } catch (err) {
      this.logger.warn(`Redis 조회 실패 (${key}): ${(err as Error).message}`);

      return null; // 캐시 miss로 간주
    }
  }

  async setValues(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Redis 저장 실패 (${key}): ${(err as Error).message}`); // 저장 실패해도 응답은 정상 반환
    }
  }

  /* 단일/복수 키 삭제  */
  async delKeys(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length === 0) return;

    try {
      await this.redis.del(...list);
    } catch (err) {
      this.logger.warn(`Redis 삭제 실패 : ${(err as Error).message}`); // 무효화 실패해도 쓰기 작업은 성공 처리
    }
  }
}
