# DATA-CATALOG-SERVICE API

## 프로젝트 개요

데이터베이스 카탈로그 관리 서비스. MySQL 데이터베이스의 스키마 정보를 수집하여 Firestore에 저장하고, 변경 사항을 추적하는 백엔드 API.

---

## 기술 스택

| 분류          | 기술                       |
| ------------- | -------------------------- |
| Framework     | NestJS 10.x                |
| Language      | TypeScript 5.x (ES2021)    |
| Database      | Firebase Firestore (NoSQL) |
| Source DB     | MySQL (mysql2)             |
| Cache         | Redis (ioredis)            |
| Documentation | Swagger                    |
| Logging       | Winston + Daily Rotate     |
| Scheduler     | @nestjs/schedule           |

---

## 프로젝트 구조

```
api/
├── src/
│   ├── main.ts                      # 앱 엔트리포인트
│   ├── config/                      # 설정 파일
│   │   ├── db.config.ts             # MySQL 연결 설정
│   │   ├── firebase.config.ts       # Firebase 설정
│   │   ├── redis.config.ts          # Redis 설정
│   │   ├── logger.config.ts         # Winston 설정
│   │   ├── swagger.config.ts        # Swagger 설정
│   │   └── validation.config.ts     # 유효성 검사 설정
│   │
│   ├── common/                      # 공통 모듈
│   │   ├── constant/                # 상수
│   │   ├── error/                   # 커스텀 에러
│   │   ├── filter/                  # 예외 필터
│   │   ├── interceptor/             # 인터셉터 (응답 포맷)
│   │   ├── interface/               # 공통 인터페이스
│   │   ├── middleware/              # 미들웨어 (로깅)
│   │   └── utils/                   # 유틸리티 함수
│   │
│   └── module/                      # 기능 모듈
│       ├── app.module.ts            # 루트 모듈
│       ├── catalog/                 # 카탈로그 모듈 (핵심)
│       │   ├── catalog.controller.ts
│       │   ├── catalog.service.ts
│       │   ├── catalog.module.ts
│       │   ├── dto/                 # DTO
│       │   ├── interface/           # 인터페이스
│       │   └── repository/          # MySQL 쿼리
│       ├── company/                 # 회사 모듈
│       ├── dashboard/               # 대시보드 모듈
│       ├── firebase/                # Firebase 서비스
│       ├── redis/                   # Redis 서비스
│       └── scheduler/               # 스케줄러
```

---

## 계층 구조 (Layer Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                      Controller Layer                        │
│   catalog.controller.ts, dashboard.controller.ts, etc.       │
│   - HTTP 요청/응답 처리                                       │
│   - DTO 유효성 검사                                           │
│   - ResponseInterface 반환                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│   catalog.service.ts, dashboard.service.ts, etc.             │
│   - 비즈니스 로직                                             │
│   - Firestore 데이터 조합                                     │
│   - 스키마 비교/변환                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌───────────────────────────┐ ┌───────────────────────────────┐
│    FirebaseService        │ │    CatalogRepository          │
│   - Firestore CRUD        │ │   - MySQL information_schema  │
│   - 저수준 문서 조작       │ │   - 커넥션 풀 관리             │
└───────────────────────────┘ └───────────────────────────────┘
            │                               │
            ▼                               ▼
      [ Firestore ]                    [ MySQL ]
```

---

## API 응답 형식

**모든 API는 다음 형식으로 응답합니다. 절대 변경하지 마세요.**

```typescript
interface ResponseInterface {
  statusCode: number; // HTTP 상태 코드
  message: string; // "success" 또는 에러 메시지
  data?: any; // 응답 데이터 (선택)
}
```

**예시:**

```json
{
  "statusCode": 200,
  "message": "success",
  "data": { ... }
}
```

---

## Firestore 컬렉션 구조

### 현재 구조 (2개 컬렉션)

```
Firestore
├── dbConnections/{companyCode}           # DB 연결 정보 (암호화됨)
│   ├── host, port, userName, password, dbName
│
└── databases/{dbName}                    # DB 정보 통합
    ├── companyCode, companyName          # 회사 정보
    ├── dbSize, totalRows, lastUpdated    # DB 통계
    ├── tableList[], dbTag                # 메타데이터
    │
    └── tables/{tableName}                # 서브컬렉션: 테이블 정보
        ├── rows, columns, size           # 테이블 통계
        ├── comment, description, sheet   # 테이블 설명
        │
        └── columns/{columnName}          # 서브컬렉션: 컬럼 정보
            ├── type, nullable, default   # 컬럼 스키마
            ├── key, comment, note        # 컬럼 메타데이터
```

### 개선 사항

1. **중복 필드 제거**: `TABLE_SCHEMA`, `TABLE_NAME`, `COLUMN_NAME`은 문서 경로에서 추출
2. **컬렉션 통합**: `database`, `masterCatalog`, `tableCatalog`, `company` → `databases` 하나로 통합
3. **일관된 필드명**: camelCase 사용 (rows, columns, size, type, nullable 등)
4. **계층 구조 명확화**: databases → tables → columns 3단계 서브컬렉션

---

## API 엔드포인트

### Catalog API (`/api/v1/databases`)

| Method | Path                                                  | 설명                          |
| ------ | ----------------------------------------------------- | ----------------------------- |
| POST   | `/db`                                                 | 새 DB 등록 및 카탈로그 생성   |
| GET    | `/db`                                                 | DB 목록 조회                  |
| GET    | `/:dbName`                                            | 마스터 카탈로그 (테이블 목록) |
| GET    | `/:dbName/stats`                                      | DB 통계                       |
| GET    | `/:dbName/tables/:tableName`                          | 테이블 카탈로그 (컬럼 목록)   |
| GET    | `/:dbName/tables/:tableName/stats`                    | 테이블 통계                   |
| GET    | `/:dbName/diff`                                       | 스키마 변경 감지              |
| PUT    | `/:dbName`                                            | 카탈로그 업데이트             |
| PATCH  | `/:dbName/tables/:tableName/description`              | 테이블 설명 수정              |
| PATCH  | `/:dbName/tables/:tableName/columns/:columnName/note` | 컬럼 노트 수정                |
| GET    | `/:dbName/erd`                                        | ERD 데이터 조회               |

### Dashboard API (`/api/v1/dashboard`)

| Method | Path     | 설명                                |
| ------ | -------- | ----------------------------------- |
| GET    | `/stats` | 전체 통계 (DB 수, 테이블 수, 행 수) |

### Company API (`/api/v1/companies`)

| Method | Path | 설명           |
| ------ | ---- | -------------- |
| GET    | `/`  | 전체 회사 목록 |

---

## 데이터 마이그레이션 가이드

### 기존 Firestore 데이터 마이그레이션

새로운 구조로 전환 시 기존 데이터 마이그레이션이 필요합니다:

1. **기존 컬렉션 (삭제 대상)**
   - `company/{dbName}` → `databases/{dbName}` 으로 통합
   - `database/{dbName}` → `databases/{dbName}` 으로 통합
   - `masterCatalog/{dbName}/tables/{tableName}` → `databases/{dbName}/tables/{tableName}` 으로 이동
   - `tableCatalog/{dbName}/{tableName}/{columnName}` → `databases/{dbName}/tables/{tableName}/columns/{columnName}` 으로 이동

2. **필드명 변환**
   - `TABLE_ROWS` → `rows`
   - `TABLE_COLUMNS` → `columns`
   - `DATA_SIZE` → `size`
   - `TABLE_COMMENT` → `comment`
   - `TABLE_DESCRIPTION` → `description`
   - `TABLE_SHEET` → `sheet`
   - `COLUMN_TYPE` → `type`
   - `IS_NULLABLE` → `nullable`
   - `COLUMN_DEFAULT` → `default`
   - `COLUMN_KEY` → `key`
   - `COLUMN_COMMENT` → `comment`
   - `COLUMN_NOTE` → `note`

3. **API 응답 호환성**
   - 프론트엔드 변경 없이 작동하도록 조회 시 기존 필드명으로 변환하여 반환

---

## 코드 컨벤션

- NestJS 표준 디렉토리 구조 준수
- 모듈별로 `controller`, `service`, `module` 파일 분리
- DTO는 `class-validator` 데코레이터 사용
- 비즈니스 로직은 Service 레이어에 작성
- Firestore 직접 접근은 `FirebaseService`를 통해서만
