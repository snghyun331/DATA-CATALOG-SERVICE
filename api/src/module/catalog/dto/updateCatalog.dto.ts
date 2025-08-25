export class UpdateCatalogDto {
  diffData?: {
    tables?: {
      deleted?: { table: string }[];
    };
    columns?: {
      deleted?: { table: string; columns: string[] }[];
    };
  };
}
