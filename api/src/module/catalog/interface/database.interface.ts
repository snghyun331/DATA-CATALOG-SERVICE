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
}

export interface ColumnDoc {
  type: string;
  nullable: string;
  default: string | null;
  key: string;
  comment: string;
  note: string;
}
