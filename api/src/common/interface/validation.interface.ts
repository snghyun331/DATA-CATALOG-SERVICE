export interface ValidationErrorDetail {
  field: string;
  error: string[];
}

export interface ValidationErrorBody {
  statusCode: number;
  message: string;
  details: any[];
  error: string;
}
