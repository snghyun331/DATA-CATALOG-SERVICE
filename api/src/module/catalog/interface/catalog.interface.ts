export interface TableColumns {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  COLUMN_DEFAULT: string | null;
  IS_NULLABLE: string;
  COLUMN_TYPE: string;
  COLUMN_KEY: string;
  COLUMN_COMMENT: string;
}

export interface MasterCatalog {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_ROWS: number;
  TABLE_COLUMNS: number;
  TABLE_COMMENT: string;
  TABLE_DESCRIPTION: string;
  DATA_SIZE: number;
}

export interface TableCatalog extends TableColumns {
  COLUMN_NOTE: string;
}
