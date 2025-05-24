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
