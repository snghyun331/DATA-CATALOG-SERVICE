# Firestore Batched Writes 적용

## 배경

### 기존 문제점

```typescript
// 개별 호출 - 각각 독립적인 API 요청
await this.firebaseService.saveDatabase(...);   // 1번 호출
await this.firebaseService.saveTable(...);      // N번 호출
await this.firebaseService.saveColumn(...);     // M번 호출
```

- 테이블 10개, 컬럼 100개면 → **111번 API 호출**
- 중간에 실패하면 **일부만 저장된 상태** (데이터 정합성 문제)

### 해결 방법: Batched Writes

모든 쓰기 작업을 하나의 batch로 묶어서 한 번에 커밋합니다.

| 상황 | 결과 |
|------|------|
| 전부 성공 | 모든 문서 저장됨 |
| 하나라도 실패 | **전체 롤백** (아무것도 저장 안 됨) |

---

## 왜 Batched Writes인가?

### 다른 방법과 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| **Batched Writes** | 구현 단순, 현재 구조와 적합 | 읽기 불가 |
| runTransaction | 읽기+쓰기, 동시성 제어 | 구현 복잡, 오버스펙 |

### 현재 프로젝트 구조

```
MySQL (읽기 전용) → NestJS → Firestore (쓰기 전용)
```

- MySQL에서 카탈로그 정보를 읽음
- Firestore에는 쓰기만 수행
- Firestore 내에서 "읽고 → 쓰기" 패턴 없음
- 따라서 **Batched Writes로 충분**

---

## 제한 사항

| 항목 | 제한 |
|------|------|
| 최대 쓰기 수 | **500개** |
| 원자성 | 보장됨 |

500개 초과 시 청크로 분할하여 처리합니다.

---

## 코드 비교: 이전 vs 수정 후

### 1. catalog.service.ts - createDbAndCatalog

#### 이전 코드

```typescript
async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
  // ... 생략 ...

  // databases/{dbName} 문서 저장
  const databaseDoc: DatabaseDoc = { ... };
  await this.firebaseService.saveDatabase(dbInfo.dbName, databaseDoc);  // API 호출 1

  // 테이블 및 컬럼 저장
  await this.saveTablesAndColumns(dbInfo.dbName, masterRows, tableRows, tableColumnCount);
}

private async saveTablesAndColumns(...): Promise<void> {
  const columnsByTable = this.groupColumnsByTable(tableRows);

  await Promise.all(
    masterRows.map(async (masterRow: any) => {
      const tableName = masterRow.TABLE_NAME;

      // 테이블 문서 저장 - 매번 API 호출
      await this.firebaseService.saveTable(dbName, tableName, tableDoc);  // API 호출 N

      // 컬럼들 저장 - 매번 API 호출
      await Promise.all(
        columns.map(async (col: any) => {
          await this.firebaseService.saveColumn(dbName, tableName, col.COLUMN_NAME, columnDoc);  // API 호출 M
        }),
      );
    }),
  );
}
```

**문제점:**
- `saveDatabase()` 1번 + `saveTable()` N번 + `saveColumn()` M번 = **1 + N + M번 API 호출**
- 중간에 실패하면 일부 데이터만 저장됨

#### 수정 후 코드

```typescript
async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
  // ... 생략 ...

  // databases/{dbName} 문서
  const databaseDoc: DatabaseDoc = { ... };

  // 테이블 및 컬럼 데이터 조립 (저장 X, 데이터 구조만 생성)
  const tables = this.buildTablesData(masterRows, tableRows, tableColumnCount);

  // Batch로 한 번에 저장
  await this.firebaseService.saveDatabaseBatch(dbInfo.dbName, databaseDoc, tables);  // API 호출 1번!
}

private buildTablesData(...): { tableName: string; tableDoc: TableDoc; columns: {...}[] }[] {
  const columnsByTable = this.groupColumnsByTable(tableRows);

  // 저장하지 않고 데이터 구조만 반환
  return masterRows.map((masterRow: any) => {
    const tableDoc: TableDoc = { ... };
    const columns = (columnsByTable[tableName] || []).map((col: any) => ({
      columnName: col.COLUMN_NAME,
      columnDoc: { ... } as ColumnDoc,
    }));

    return { tableName, tableDoc, columns };
  });
}
```

**개선점:**
- 데이터 조립과 저장 로직 분리
- `saveDatabaseBatch()` 한 번 호출로 모든 문서 저장
- 원자성 보장 (전체 성공 또는 전체 실패)

---

### 2. catalog.service.ts - updateCatalog

#### 이전 코드

```typescript
async updateCatalog(dbName: string, diffData?: any) {
  // ... 삭제 로직 ...

  // databases/{dbName} 문서 업데이트
  await this.firebaseService.saveDatabase(dbName, databaseDoc as DatabaseDoc);  // API 호출 1

  // 테이블 및 컬럼 저장
  await this.updateTablesAndColumns(dbName, masterRows, tableRows, tableColumnCount);
}

private async updateTablesAndColumns(...): Promise<void> {
  await Promise.all(
    masterRows.map(async (masterRow: any) => {
      // 기존 테이블 정보 조회 (description 유지용)
      const existingTable = await this.firebaseService.getTable(dbName, tableName);

      await this.firebaseService.saveTable(dbName, tableName, tableDoc);  // API 호출 N

      await Promise.all(
        columns.map(async (col: any) => {
          // 기존 컬럼 정보 조회 (note 유지용)
          const existingColumn = await this.firebaseService.getColumn(dbName, tableName, col.COLUMN_NAME);

          await this.firebaseService.saveColumn(dbName, tableName, col.COLUMN_NAME, columnDoc);  // API 호출 M
        }),
      );
    }),
  );
}
```

**문제점:**
- 조회와 저장이 섞여 있음
- 개별 저장으로 인한 다수의 API 호출

#### 수정 후 코드

```typescript
async updateCatalog(dbName: string, diffData?: any) {
  // ... 삭제 로직 ...

  // databases/{dbName} 문서
  const databaseDoc: Partial<DatabaseDoc> = { ... };

  // 테이블 및 컬럼 데이터 조립 (기존 description, note 유지)
  const tables = await this.buildTablesDataForUpdate(dbName, masterRows, tableRows, tableColumnCount);

  // Batch로 한 번에 업데이트
  await this.firebaseService.updateCatalogBatch(dbName, databaseDoc, tables);  // API 호출 1번!
}

private async buildTablesDataForUpdate(...): Promise<{...}[]> {
  return Promise.all(
    masterRows.map(async (masterRow: any) => {
      // 기존 정보 조회 (description, note 유지용)
      const existingTable = await this.firebaseService.getTable(dbName, tableName);

      const columns = await Promise.all(
        columnsData.map(async (col: any) => {
          const existingColumn = await this.firebaseService.getColumn(dbName, tableName, col.COLUMN_NAME);
          return { columnName, columnDoc: { ...existingColumn?.note } };
        }),
      );

      return { tableName, tableDoc, columns };
    }),
  );
}
```

**개선점:**
- 조회 로직은 `buildTablesDataForUpdate()`에서 처리
- 저장 로직은 `updateCatalogBatch()`에서 batch로 한 번에 처리
- 기존 `description`, `note` 값 유지

---

### 3. firebase.service.ts - 새로운 Batch 메서드

#### 추가된 메서드

```typescript
/* Database + Tables + Columns를 Batch로 한 번에 저장 */
async saveDatabaseBatch(
  dbName: string,
  databaseDoc: DatabaseDoc,
  tables: { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[],
): Promise<void> {
  const operations = this.buildBatchOperations(dbName, databaseDoc, tables);
  await this.executeBatchInChunks(operations);
}

/* Batch 작업 목록 생성 */
private buildBatchOperations(...): { ref: DocumentReference; data: any }[] {
  const operations = [];

  // Database 문서
  const dbRef = this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName);
  operations.push({ ref: dbRef, data: databaseDoc });

  // Tables 및 Columns 문서
  tables.forEach(({ tableName, tableDoc, columns }) => {
    const tableRef = dbRef.collection(this.TABLES_SUBCOLLECTION).doc(tableName);
    operations.push({ ref: tableRef, data: tableDoc });

    columns.forEach(({ columnName, columnDoc }) => {
      const columnRef = tableRef.collection(this.COLUMNS_SUBCOLLECTION).doc(columnName);
      operations.push({ ref: columnRef, data: columnDoc });
    });
  });

  return operations;
}

/* 500개씩 청크로 나눠서 Batch 실행 */
private async executeBatchInChunks(operations: { ref: DocumentReference; data: any }[]): Promise<void> {
  const BATCH_LIMIT = 500;
  const chunks = this.chunkArray(operations, BATCH_LIMIT);

  for (const chunk of chunks) {
    const batch = this.firestore.batch();
    chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();  // 한 번에 커밋
  }
}
```

**핵심 로직:**
1. `buildBatchOperations()`: 모든 문서 참조와 데이터를 배열로 조립
2. `executeBatchInChunks()`: 500개 제한을 고려해 청크로 분할 후 batch 커밋

---

## 변경 요약

| 항목 | 이전 | 수정 후 |
|------|------|---------|
| API 호출 수 | 1 + N + M번 | 1번 (또는 청크 수) |
| 원자성 | ❌ 부분 저장 가능 | ✅ 전체 성공/실패 |
| 코드 구조 | 조회 + 저장 혼합 | 조립 → 저장 분리 |
| 500개 초과 대응 | 해당 없음 | 청크 분할 처리 |

---

## 참고

- [Firestore Batched Writes 공식 문서](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)
