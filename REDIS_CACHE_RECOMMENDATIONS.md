# Redis 캐시 추가 권장 사항

`catalog` 모듈에 Redis 캐시(`getMasterCatalog`, `getTableCatalog`)를 도입하면서 **Codex/Claude가 권장한 추가 반영 사항** 정리.
각 항목별로 권장 출처, 이유, 코드 스케치, 현재 적용 여부를 기록한다.

---

## 적용 현황 한눈에 보기

| ID  | 항목                                  | 출처    | 적용  | 비고                          |
| --- | ------------------------------------- | ------- | ----- | ----------------------------- |
| A   | 신규 DB 등록 시 안전빵 무효화         | Codex   | ✅    | `createDbAndCatalog` 후 del   |
| B   | 빈 결과는 캐시하지 않기 (음수 캐싱)   | Codex   | ✅    | `result.length > 0` 가드      |
| C   | `updateCatalog` 무효화 범위           | Codex   | 🟡    | 핀포인트로 적용 (DB 단위는 보류) |
| D   | 키 정규화 (`trim`)                    | Codex   | ✅    | 키 헬퍼에 `.trim()`            |
| E   | `getValues<T>` 제네릭 타입            | Codex   | ❌    | `as unknown as` 캐스팅으로 대체 |
| F   | Redis 장애 시 fallback (try/catch)    | Claude  | ❌    | 적용 시 운영 안정성↑          |
| G   | 캐시 stampede(thundering herd) 방지   | Codex   | ❌    | 트래픽 증가 시 재검토         |

---

## A. 신규 DB 등록 시 안전빵 무효화 ✅

**출처**: Codex
**이유**: 같은 `dbName`으로 과거에 등록·삭제·재등록되는 경우, 또는 빈 결과 캐시가 남아있는 경우 stale을 차단.
**적용 위치**: `createDbAndCatalog`의 `saveAllBatch` 직후.

```ts
await this.firebaseService.saveAllBatch(companyCode, dbInfo, dbInfo.dbName, databaseDoc, tables);

// 같은 dbName으로 과거 빈 결과 캐시가 남아있을 수 있어 master 캐시 선제 무효화
await this.redisService.delKeys(this.keyMaster(dbInfo.dbName));
```

비용: Redis `DEL` 1회 (~0.1ms). 캐시가 없으면 no-op.

---

## B. 빈 결과는 캐시하지 않기 (음수 캐싱 방지) ✅

**출처**: Codex (Claude 보강)
**이유**: 빈 배열을 캐시해두면, 존재하지 않는 `dbName`/`tableName`에 대한 잘못된 요청 한 번이 TTL 내내 빈 화면을 반환하게 만든다. 진짜로 데이터가 채워져도 TTL이 끝날 때까지 사용자는 빈 결과만 본다.
**적용 위치**: `getMasterCatalog`, `getTableCatalog`의 `set` 직전.

```ts
const result: MasterCatalog[] = tables.map(/* ... */);

// 빈 결과는 캐시하지 않는다 (음수 캐싱 방지)
if (result.length > 0) {
  await this.redisService.setValues(key, result, this.TTL.MASTER);
}

return result;
```

---

## C. `updateCatalog` 무효화 범위 🟡

**출처**: Codex
**Codex 권장**: DB 단위 전체 (`table:*` 패턴 삭제) — 누락 가능성을 원천 차단.
**현재 결정**: **핀포인트(diffData 기반)** 유지 — 단순성·예측 가능성 우선.

### 현재 적용된 핀포인트 방식

```ts
// 변경 영향받은 테이블의 컬럼 캐시 + master 캐시 일괄 무효화
const affectedTables = new Set<string>([
  ...((diffData?.tables?.added ?? []) as { table: string }[]).map((t) => t.table),
  ...((diffData?.tables?.deleted ?? []) as { table: string }[]).map((t) => t.table),
  ...((diffData?.columns?.added ?? []) as { table: string }[]).map((c) => c.table),
  ...((diffData?.columns?.deleted ?? []) as { table: string }[]).map((c) => c.table),
  ...((diffData?.columns?.updated ?? []) as { table: string }[]).map((c) => c.table),
]);
await this.redisService.delKeys([
  this.keyMaster(dbName),
  ...Array.from(affectedTables).map((t) => this.keyTable(dbName, t)),
]);
```

### Codex 권장(DB 단위 전체) 방식 — 향후 옵션

```ts
// 모든 table:* 키를 한 번에 삭제 (SCAN 사용)
const stream = this.redis.scanStream({ match: `dc:v1:db:${dbName}:table:*:columns` });
const keys: string[] = [];
for await (const chunk of stream) keys.push(...chunk);
keys.push(this.keyMaster(dbName));
if (keys.length > 0) await this.redis.del(...keys);
```

**선택 기준**:
- 핀포인트: `diffData` 신뢰 가능, 복잡한 시나리오 적은 경우
- DB 단위 전체: `diffData` 누락 가능성·복합 변경 많은 경우, "확실히 깨고 싶다"는 운영 정책

---

## D. 키 정규화 ✅

**출처**: Codex
**이유**: 어딘가에서 `dbName`이 공백/대소문자 차이로 들어오면 `setValues` 키와 `delKeys` 키가 어긋나서 무효화가 통째로 실패할 수 있다.
**적용 위치**: 키 헬퍼.

```ts
private keyMaster(dbName: string): string {
  return `dc:v1:db:${dbName.trim()}:tables`;
}
private keyTable(dbName: string, tableName: string): string {
  return `dc:v1:db:${dbName.trim()}:table:${tableName.trim()}:columns`;
}
```

대소문자 표준화까지 필요하면 `.trim().toLowerCase()`로 확장.

---

## E. `getValues<T>` 제네릭 타입 ❌

**출처**: Codex (필수 권고)
**이유**: 현재 `getValues`는 반환 타입이 `Promise<string | null>`로 선언되어 있어, 호출부에서 매번 `as unknown as MasterCatalog[]` 같은 캐스팅이 필요. 제네릭으로 바꾸면 호출부 타입 안전성 확보.

### 현재 (캐스팅 사용)

```ts
// RedisService
async getValues(key: string): Promise<string | null> { /* ... */ }

// CatalogService 호출부
const cached = await this.redisService.getValues(key);
if (cached) return cached as unknown as MasterCatalog[];
```

### Codex 권장 (제네릭)

```ts
// RedisService
async getValues<T>(key: string): Promise<T | null> {
  const raw = await this.redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

// CatalogService 호출부
const cached = await this.redisService.getValues<MasterCatalog[]>(key);
if (cached) return cached;   // 캐스팅 불필요
```

**미적용 사유**: 초기에 사용자가 제네릭을 빼고 작성을 선호함. 호출부에서 `as unknown as`로 우회 중이지만, 제네릭이 더 안전하고 깔끔.

---

## F. Redis 장애 시 fallback ❌

**출처**: Claude
**이유**: 현재 구현은 Redis가 죽으면 `redis.get/set/del`이 throw해서 **API 자체가 500 에러를 반환**한다. 캐시는 "있으면 좋은 것"이지 "필수"가 아니어야 한다.

### 현재 (장애 시 즉시 실패)

```ts
async getValues(key: string): Promise<string | null> {
  const raw: string = await this.redis.get(key);    // ❌ Redis 죽으면 throw
  if (!raw) return null;
  return JSON.parse(raw);
}
```

### 권장 (장애 시 캐시만 무시하고 정상 흐름 유지)

```ts
async getValues(key: string): Promise<string | null> {
  try {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    this.logger.warn(`Redis GET 실패 (${key}): ${(err as Error).message}`);
    return null;   // 캐시 miss로 간주 → Firestore로 fallback
  }
}

async setValues(key: string, value: any, ttlSeconds: number) {
  try {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    this.logger.warn(`Redis SET 실패 (${key}): ${(err as Error).message}`);
    // 저장 실패해도 응답은 정상 반환
  }
}

async delKeys(keys: string | string[]): Promise<void> {
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return;
  try {
    await this.redis.del(...list);
  } catch (err) {
    this.logger.warn(`Redis DEL 실패: ${(err as Error).message}`);
    // 무효화 실패해도 쓰기 작업은 성공 처리
  }
}
```

**추가 강화 옵션**: 30초 circuit breaker — Redis 장애가 지속될 때 매 요청마다 에러 로깅 폭주를 막음.

```ts
private redisDownUntil = 0;

private isRedisAvailable(): boolean {
  return Date.now() > this.redisDownUntil;
}

private markRedisDown() {
  this.redisDownUntil = Date.now() + 30_000; // 30초간 캐시 우회
}
```

---

## G. 캐시 stampede (thundering herd) 방지 ❌

**출처**: Codex (low priority)
**이유**: 캐시가 만료된 직후 동시에 다수 요청이 들어오면, 모두 miss 처리되어 Firestore에 동시 폭주(thundering herd)할 수 있음. 무료 티어에서 한 번에 N건 read 소모.

### 권장 (간이 잠금)

```ts
async getMasterCatalog(dbName: string): Promise<MasterCatalog[]> {
  const key = this.keyMaster(dbName);
  const lockKey = `${key}:lock`;

  const cached = await this.redisService.getValues(key);
  if (cached) return cached as unknown as MasterCatalog[];

  // 동시 miss 시 1개만 Firestore로 가도록 lock 시도 (3초 TTL)
  const acquired = await this.redis.set(lockKey, '1', 'EX', 3, 'NX');
  if (!acquired) {
    // 다른 요청이 이미 Firestore에 가고 있음 → 잠시 후 재시도
    await new Promise((r) => setTimeout(r, 100));
    return this.getMasterCatalog(dbName);
  }

  try {
    const result = await /* Firestore 조회 */;
    if (result.length > 0) {
      await this.redisService.setValues(key, result, this.TTL.MASTER);
    }
    return result;
  } finally {
    await this.redis.del(lockKey);
  }
}
```

**적용 보류 사유**: 현재 무료 티어·소수 사용자 시나리오에선 동시 miss가 거의 발생하지 않음. 트래픽 증가하거나 동시 사용자 다수 도입 시 재검토.

---

## 우선순위 추천

1. **F (장애 fallback)** — 운영 안정성 가장 큰 효과. 작업량도 적음.
2. **E (제네릭 타입)** — 코드 안전성, 호출부 정리. 5분 작업.
3. **G (stampede)** — 트래픽 늘면 추가 검토.
4. **C (DB 단위 무효화)** — `diffData` 누락 사고를 한 번이라도 겪으면 전환.

---

## 참고 — 현재 캐시 적용 매트릭스

| API                                                                       | 캐시 적용                  | 무효화 위치                                                    |
| ------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| `GET /databases/:dbName` (`getMasterCatalog`)                             | ✅ `keyMaster(db)`         | -                                                              |
| `GET /databases/:dbName/tables/:tableName` (`getTableCatalog`)            | ✅ `keyTable(db, table)`   | -                                                              |
| `PATCH /databases/:dbName/tables/:tableName/description`                  | -                          | `keyMaster(db)` del                                            |
| `PATCH /databases/:dbName/tables/:tableName/columns/:col/note`            | -                          | `keyTable(db, table)` del                                      |
| `PUT /databases/:dbName` (`updateCatalog`)                                | -                          | `keyMaster(db)` + 영향받은 `keyTable(db, *)` 핀포인트          |
| `POST /databases/db` (`createDbAndCatalog`)                               | -                          | `keyMaster(새DB)` (안전빵)                                     |
| `GET /databases/db`, `/stats`, `/dashboard/overview`, `/erd`, `/diff`     | ❌                         | -                                                              |
