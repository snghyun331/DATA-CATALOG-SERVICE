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

### 현재 구조 (5개 컬렉션)

```
Firestore
├── dbConnections/{companyCode}           # DB 연결 정보
│   ├── host, port, userName, password, dbName
│
├── company/{dbName}                      # 회사-DB 매핑
│   ├── companyCode, companyName
│
├── database/{dbName}                     # DB 통계 (대시보드용)
│   ├── tableList[], dbSize, totalRows, lastUpdated, dbTag
│
├── masterCatalog/{dbName}                # 테이블 목록
│   └── tables/{tableName}                # 서브컬렉션
│       ├── TABLE_SCHEMA, TABLE_NAME
│       ├── TABLE_ROWS, TABLE_COLUMNS
│       ├── TABLE_COMMENT, TABLE_DESCRIPTION
│       ├── TABLE_SHEET, DATA_SIZE
│
└── tableCatalog/{dbName}                 # 컬럼 상세
    └── {tableName}/{columnName}          # 서브컬렉션
        ├── TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
        ├── COLUMN_DEFAULT, IS_NULLABLE
        ├── COLUMN_TYPE, COLUMN_KEY
        ├── COLUMN_COMMENT, COLUMN_NOTE
```

### 알려진 문제점

1. **중복 필드**: `TABLE_SCHEMA`, `TABLE_NAME`, `COLUMN_NAME`이 문서 경로와 중복 저장됨
2. **컬렉션 분리 과다**: `database`, `masterCatalog`, `tableCatalog`가 분리되어 있어 여러 번 조회 필요
3. **문서 ID 불일치**: `company` 컬렉션의 문서 ID가 `dbName`인데 회사 정보 저장

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

## 리팩토링 가이드

### 주의사항

1. **API 응답 형태 유지**: 프론트엔드 수정 없이 진행하려면 `ResponseInterface` 형태를 절대 변경하지 마세요
2. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 마세요. 컬렉션 하나씩 개선
3. **백업 필수**: Firestore 데이터 Export 후 작업

### 권장 개선 순서

1. **1단계 (낮은 위험)**

   - 중복 필드 제거 (`TABLE_SCHEMA`, `TABLE_NAME`, `COLUMN_NAME`)
   - 저장 시 제거, 조회 시 경로에서 복원

2. **2단계 (중간 위험)**

   - `database` + `masterCatalog` + `tableCatalog` → `databases` 통합
   - 새 컬렉션에 복사 → 읽기 전환 → 쓰기 전환 → 기존 삭제

3. **3단계 (선택)**
   - `company` → `companies` 구조 변경
   - Repository 패턴 도입
   - 타입 안전성 강화

### 권장 Firestore 구조

```
databases/{dbName}
├── companyCode
├── dbSize, totalRows, lastUpdated, dbTag
└── tables/{tableName}                    # 서브컬렉션
    ├── rows, columns, size, comment, description
    └── columns/{columnName}              # 서브컬렉션
        ├── type, nullable, default, key, comment, note
```

---

## 코드 컨벤션

- NestJS 표준 디렉토리 구조 준수
- 모듈별로 `controller`, `service`, `module` 파일 분리
- DTO는 `class-validator` 데코레이터 사용
- 비즈니스 로직은 Service 레이어에 작성
- Firestore 직접 접근은 `FirebaseService`를 통해서만
