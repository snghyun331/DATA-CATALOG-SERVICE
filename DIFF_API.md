# Database Diff API Documentation

## API Endpoint
```
GET /api/v1/databases/:dbName/diff
```

## Description
데이터베이스의 스키마 변경사항을 감지하여 현재 상태와 카탈로그에 저장된 상태의 차이점을 반환합니다.

## Parameters
- `dbName` (string): 변경사항을 확인할 데이터베이스 이름

## Response Format

### Success Response (200 OK)
```json
{
  "message": "success",
  "data": {
    "changed": true,
    "tables": {
      "added": [
        {
          "table": "new_users",
          "columns": 5,
          "description": "새로 추가된 사용자 테이블"
        },
        {
          "table": "audit_log",
          "columns": 8,
          "description": "감사 로그 테이블"
        }
      ],
      "deleted": [
        {
          "table": "old_temp_table",
          "columns": 3,
          "description": "삭제된 임시 테이블"
        }
      ]
    },
    "columns": {
      "added": [
        {
          "table": "users",
          "column": "email_verified_at",
          "type": "timestamp",
          "nullable": true,
          "default": null
        },
        {
          "table": "products",
          "column": "category_id",
          "type": "int(11)",
          "nullable": false,
          "default": null
        }
      ],
      "deleted": [
        {
          "table": "users",
          "column": "old_status",
          "type": "varchar(50)",
          "nullable": true,
          "default": "active"
        }
      ],
      "updated": [
        {
          "table": "orders",
          "column": "amount",
          "old_type": "decimal(10,2)",
          "new_type": "decimal(12,2)",
          "old_nullable": false,
          "new_nullable": false,
          "old_default": "0.00",
          "new_default": "0.00"
        }
      ]
    }
  }
}
```

### No Changes Response (200 OK)
```json
{
  "message": "success",
  "data": {
    "changed": false,
    "tables": {
      "added": [],
      "deleted": []
    },
    "columns": {
      "added": [],
      "deleted": [],
      "updated": []
    }
  }
}
```

### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Database not found",
  "path": "/api/v1/databases/nonexistent_db/diff"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "statusCode": 500,
  "message": "Database connection failed",
  "path": "/api/v1/databases/company_db/diff"
}
```

## Response Fields Description

### Root Level
- `message` (string): API 호출 결과 메시지
- `data` (object): 변경사항 데이터

### Data Object
- `changed` (boolean): 변경사항 존재 여부
- `tables` (object): 테이블 레벨 변경사항
- `columns` (object): 컬럼 레벨 변경사항

### Tables Object
- `added` (array): 새로 추가된 테이블 목록
- `deleted` (array): 삭제된 테이블 목록

### Added/Deleted Table Fields
- `table` (string): 테이블 이름
- `columns` (number): 컬럼 개수
- `description` (string): 테이블 설명

### Columns Object
- `added` (array): 새로 추가된 컬럼 목록
- `deleted` (array): 삭제된 컬럼 목록
- `updated` (array): 수정된 컬럼 목록

### Added/Deleted Column Fields
- `table` (string): 테이블 이름
- `column` (string): 컬럼 이름
- `type` (string): 데이터 타입
- `nullable` (boolean): NULL 허용 여부
- `default` (any): 기본값

### Updated Column Fields
- `table` (string): 테이블 이름
- `column` (string): 컬럼 이름
- `old_type` (string): 기존 데이터 타입
- `new_type` (string): 새로운 데이터 타입
- `old_nullable` (boolean): 기존 NULL 허용 여부
- `new_nullable` (boolean): 새로운 NULL 허용 여부
- `old_default` (any): 기존 기본값
- `new_default` (any): 새로운 기본값

## Usage Example

### JavaScript/TypeScript
```typescript
import apiClient from '../api/apiClient';

// 단일 데이터베이스 변경사항 확인
const checkDatabaseChanges = async (dbName: string) => {
  try {
    const response = await apiClient.get(`/api/v1/databases/${dbName}/diff`);
    const diffData = response.data.data;
    
    if (diffData.changed) {
      console.log('변경사항이 감지되었습니다.');
      console.log('추가된 테이블:', diffData.tables.added.length);
      console.log('삭제된 테이블:', diffData.tables.deleted.length);
      console.log('추가된 컬럼:', diffData.columns.added.length);
      console.log('삭제된 컬럼:', diffData.columns.deleted.length);
      console.log('수정된 컬럼:', diffData.columns.updated.length);
    } else {
      console.log('변경사항이 없습니다.');
    }
  } catch (error) {
    console.error('Diff 조회 실패:', error);
  }
};

// 여러 데이터베이스 변경사항 확인
const checkMultipleDatabases = async (dbNames: string[]) => {
  const results = await Promise.all(
    dbNames.map(async (dbName) => {
      try {
        const response = await apiClient.get(`/api/v1/databases/${dbName}/diff`);
        return {
          dbName,
          hasChanges: response.data.data.changed,
          diffData: response.data.data
        };
      } catch (error) {
        return {
          dbName,
          hasChanges: false,
          error: error.message
        };
      }
    })
  );
  
  return results;
};
```

## UI Integration

### React Component Example
```tsx
const DatabaseCard = ({ dbName }: { dbName: string }) => {
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    const checkChanges = async () => {
      try {
        const response = await apiClient.get(`/api/v1/databases/${dbName}/diff`);
        setHasChanges(response.data.data.changed);
      } catch (error) {
        console.error(`Error checking changes for ${dbName}:`, error);
      }
    };
    
    checkChanges();
  }, [dbName]);
  
  return (
    <div className="database-card">
      <div className="database-icon-container">
        <DatabaseIcon />
        {hasChanges && (
          <div className="change-indicator">
            <AlertCircle />
          </div>
        )}
      </div>
      {hasChanges && (
        <button onClick={() => handleUpdate(dbName)}>
          업데이트
        </button>
      )}
    </div>
  );
};
```

## Notes
- API는 실제 데이터베이스 스키마와 Firebase Firestore에 저장된 카탈로그 정보를 비교합니다
- `changed: true`인 경우에만 UI에서 업데이트 버튼을 표시해야 합니다
- 대용량 데이터베이스의 경우 응답 시간이 길어질 수 있습니다
- 에러 처리를 통해 데이터베이스 연결 실패나 권한 문제를 적절히 처리해야 합니다