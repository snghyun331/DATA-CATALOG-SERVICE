// 새로운 Firestore 구조에 맞는 인터페이스 정의
// databases/{dbName}/tables/{tableName}/columns/{columnName}

export interface DatabaseDoc {
  companyCode: string;
  companyName: string;
  dbSize: number;
  totalRows: number;
  lastUpdated: Date;
  dbTag?: string;
  tableList: string[];
}

export interface TableDoc {
  rows: number;
  columns: number;
  size: number;
  comment: string;
  description: string;
  sheet?: string;
}

export interface ColumnDoc {
  type: string;
  nullable: string;
  default: string | null;
  key: string;
  comment: string;
  note: string;
}

// 조회 시 경로 정보를 복원한 전체 데이터
export interface TableFullData extends TableDoc {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
}

export interface ColumnFullData extends ColumnDoc {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
}
