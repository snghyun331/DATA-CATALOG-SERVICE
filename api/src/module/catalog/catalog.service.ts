import { ConflictException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';
import { MasterCatalog, TableCatalog, TableColumns } from './interface/catalog.interface';
import { DatabaseDoc, TableDoc, ColumnDoc } from './interface/database.interface';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly catalogRepository: CatalogRepository,
    private readonly firebaseService: FirebaseService,
  ) {}

  /* 마스터 카탈로그를 조회하는 함수 */
  async getMasterCatalog(dbName: string): Promise<MasterCatalog[]> {
    const tables: { tableName: string; data: TableDoc }[] = await this.firebaseService.getAllTables(dbName);

    return tables.map(({ tableName, data }) => ({
      TABLE_SCHEMA: dbName,
      TABLE_NAME: tableName,
      TABLE_ROWS: data.rows,
      TABLE_COLUMNS: data.columns,
      TABLE_COMMENT: data.comment,
      TABLE_DESCRIPTION: data.description,
      DATA_SIZE: data.size,
    }));
  }

  /* 테이블 카탈로그를 조회하는 함수 */
  async getTableCatalog(dbName: string, tableName: string): Promise<TableCatalog[]> {
    const columns: { columnName: string; data: ColumnDoc }[] = await this.firebaseService.getAllColumns(
      dbName,
      tableName,
    );

    return columns.map(({ columnName, data }) => ({
      TABLE_SCHEMA: dbName,
      TABLE_NAME: tableName,
      COLUMN_NAME: columnName,
      COLUMN_DEFAULT: data.default,
      IS_NULLABLE: data.nullable,
      COLUMN_TYPE: data.type,
      COLUMN_KEY: data.key,
      COLUMN_COMMENT: data.comment,
      COLUMN_NOTE: data.note,
    }));
  }

  /* 새 DB 등록 및 카탈로그 생성하는 함수 */
  async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
    const { companyCode, companyName, ...dbInfo } = dto;

    // 이미 같은 DB가 저장되었다면 예외처리
    const isCatalogExist: boolean = await this.firebaseService.isDatabaseExist(dbInfo.dbName);
    if (isCatalogExist) {
      throw new ConflictException('해당 DB는 이미 추가되었습니다.');
    }

    // 1단계: dto로 직접 MySQL 연결
    const connection = await this.catalogRepository.createDirectConnection(dbInfo);

    try {
      // 2단계: MySQL에서 카탈로그 정보 조회
      const tableRows = (await this.catalogRepository.getTableCatalogInDb(dbInfo.dbName, connection)) as any[];
      const masterRows = (await this.catalogRepository.getMasterCatalogInDb(dbInfo.dbName, connection)) as any[];
      const dbDataSize = await this.catalogRepository.getDatabaseDataSize(dbInfo.dbName, connection);

      // 컬럼 수 계산
      const tableColumnCount = this.calculateColumnCount(tableRows);

      // 테이블 목록 생성
      const tableList = masterRows.map((row: any) => row.TABLE_NAME);
      const totalRows = masterRows.reduce((sum: number, row: any) => sum + row.TABLE_ROWS, 0);

      // databases/{dbName} 문서
      const databaseDoc: DatabaseDoc = {
        companyCode,
        companyName,
        dbSize: dbDataSize,
        totalRows,
        lastUpdated: new Date(),
        tableList,
        dbTag: dto.dbTag,
      };

      // 테이블 및 컬럼 데이터 조립
      const tables = this.buildTablesData(masterRows, tableRows, tableColumnCount);

      // 3단계: Batch로 dbConnection + database + tables + columns 한 번에 저장 (원자성 보장)
      await this.firebaseService.saveAllBatch(companyCode, dbInfo, dbInfo.dbName, databaseDoc, tables);
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /* 테이블 및 컬럼 데이터 조립 */
  private buildTablesData(
    masterRows: any[],
    tableRows: any[],
    tableColumnCount: Record<string, number>,
  ): { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[] {
    const columnsByTable = this.groupColumnsByTable(tableRows);

    return masterRows.map((masterRow: any) => {
      const tableName = masterRow.TABLE_NAME;
      const key = `${masterRow.TABLE_SCHEMA}.${tableName}`;

      const tableDoc: TableDoc = {
        rows: masterRow.TABLE_ROWS,
        columns: tableColumnCount[key] || 0,
        size: Number(masterRow.DATA_SIZE),
        comment: masterRow.TABLE_COMMENT || '',
        description: '',
      };

      /*
       * <해당 테이블의 컬럼들을 Batch 저장용 구조로 변환>
       * columnsByTable[tableName]: 테이블명으로 그룹화된 컬럼 배열
       * || []: 컬럼이 없는 경우 빈 배열로 대체 (map 에러 방지)
       * .map(): MySQL 컬럼 데이터 → { columnName, columnDoc } 형태로 변환
       *
       * <변환 예시>
       * MySQL: { COLUMN_NAME: "id", COLUMN_TYPE: "int", ... }
       *   ↓
       * Batch용: { columnName: "id", columnDoc: { type: "int", ... } }
       * 
       * <출력 예시>
       * [
       *  {
            tableName: 'admin',
            tableDoc: { rows: 47, columns: 5, size: 0.05, comment: '', description: '' },
            columns: [ [Object], [Object], [Object], [Object], [Object] ]
          }, .... 
         ]   
       */
      const columns = (columnsByTable[tableName] || []).map((col: any) => ({
        columnName: col.COLUMN_NAME,
        columnDoc: {
          type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE,
          default: col.COLUMN_DEFAULT,
          key: col.COLUMN_KEY,
          comment: col.COLUMN_COMMENT || '',
          note: '', // 신규 컬럼이므로 빈 값
        } as ColumnDoc,
      }));

      return { tableName, tableDoc, columns };
    });
  }

  /* 컬럼 수 계산 */
  private calculateColumnCount(tableRows: any[]): Record<string, number> {
    const count: Record<string, number> = {};
    tableRows.forEach((row: any) => {
      const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
      count[key] = (count[key] || 0) + 1;
    });

    return count;
  }

  /* 테이블별 컬럼 그룹화 */
  private groupColumnsByTable(tableRows: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    tableRows.forEach((row: any) => {
      if (!grouped[row.TABLE_NAME]) {
        grouped[row.TABLE_NAME] = [];
      }
      grouped[row.TABLE_NAME].push(row);
    });

    return grouped;
  }

  /* 스키마 변경을 감지하는 함수 */
  async detectChanges(dbName: string) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    const companyCode = dbData.companyCode;
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);

    try {
      // MySQL에서 현재 스키마 조회
      const newSchema: TableColumns[] = (await this.catalogRepository.getTableCatalogInDb(
        dbName,
        connection,
      )) as TableColumns[];

      // Firestore에서 기존 스키마 조회
      const tables = await this.firebaseService.getAllTables(dbName);
      const oldSchema: TableColumns[] = [];

      await Promise.all(
        tables.map(async ({ tableName }) => {
          const columns = await this.firebaseService.getAllColumns(dbName, tableName);
          columns.forEach(({ columnName, data }) => {
            oldSchema.push({
              TABLE_SCHEMA: dbName,
              TABLE_NAME: tableName,
              COLUMN_NAME: columnName,
              COLUMN_DEFAULT: data.default,
              IS_NULLABLE: data.nullable,
              COLUMN_TYPE: data.type,
              COLUMN_KEY: data.key,
              COLUMN_COMMENT: data.comment,
            });
          });
        }),
      );

      return this.compareSchemas(newSchema, oldSchema);
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /* 스키마를 비교하는 함수 */
  private compareSchemas(newSchema: TableColumns[], oldSchema: TableColumns[]) {
    const result = {
      changed: false,
      tables: {
        changed: false,
        added: [] as { table: string }[],
        deleted: [] as { table: string }[],
      },
      columns: {
        changed: false,
        added: [] as { table: string; columns: string[] }[],
        deleted: [] as { table: string; columns: string[] }[],
        updated: [] as { table: string; columns: string[] }[],
      },
    };

    const oldTables = this.groupByTableName(oldSchema);
    const newTables = this.groupByTableName(newSchema);
    const allTableNames = Array.from(new Set([...Object.keys(oldTables), ...Object.keys(newTables)]));

    allTableNames.forEach((tableName) => {
      const oldColumns = oldTables[tableName] || [];
      const newColumns = newTables[tableName] || [];

      // 테이블 추가 감지
      if (oldColumns.length === 0 && newColumns.length > 0) {
        result.tables.added.push({ table: tableName });
        result.tables.changed = true;
        result.changed = true;
      }

      // 테이블 삭제 감지
      if (newColumns.length === 0 && oldColumns.length > 0) {
        result.tables.deleted.push({ table: tableName });
        result.tables.changed = true;
        result.changed = true;
      }

      const oldColNames = oldColumns.map((col) => col.COLUMN_NAME);
      const newColNames = newColumns.map((col) => col.COLUMN_NAME);

      // 컬럼 추가
      const added = newColNames.filter((name) => !oldColNames.includes(name));
      if (added.length > 0) {
        result.columns.added.push({ table: tableName, columns: added });
        result.columns.changed = true;
        result.changed = true;
      }

      // 컬럼 삭제
      const deleted = oldColNames.filter((name) => !newColNames.includes(name));
      if (deleted.length > 0) {
        result.columns.deleted.push({ table: tableName, columns: deleted });
        result.columns.changed = true;
        result.changed = true;
      }

      // 컬럼 수정
      const updated = newColNames.filter((name) => {
        const oldCol = oldColumns.find((c) => c.COLUMN_NAME === name);
        const newCol = newColumns.find((c) => c.COLUMN_NAME === name);
        return (
          oldCol && newCol && (oldCol.COLUMN_TYPE !== newCol.COLUMN_TYPE || oldCol.IS_NULLABLE !== newCol.IS_NULLABLE)
        );
      });

      if (updated.length > 0) {
        result.columns.updated.push({ table: tableName, columns: updated });
        result.columns.changed = true;
        result.changed = true;
      }
    });

    return result;
  }

  /* 테이블명으로 그룹화 */
  private groupByTableName(schema: TableColumns[]): Record<string, TableColumns[]> {
    const result: Record<string, TableColumns[]> = {};
    schema.forEach((row) => {
      if (!result[row.TABLE_NAME]) {
        result[row.TABLE_NAME] = [];
      }
      result[row.TABLE_NAME].push(row);
    });
    return result;
  }

  async updateCatalog(dbName: string, diffData?: any) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    const companyCode = dbData.companyCode;
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);

    try {
      // 삭제 로직 우선 처리
      if (diffData) {
        // 삭제된 테이블 처리
        if (diffData.tables?.deleted?.length > 0) {
          await Promise.all(
            diffData.tables.deleted.map(async (item: { table: string }) => {
              await this.firebaseService.deleteTable(dbName, item.table);
            }),
          );
        }

        // 삭제된 컬럼 처리 (삭제된 테이블의 컬럼은 제외)
        if (diffData.columns?.deleted?.length > 0) {
          const deletedTableNames = diffData.tables?.deleted?.map((item: { table: string }) => item.table) || [];

          await Promise.all(
            diffData.columns.deleted
              .filter((item: { table: string }) => !deletedTableNames.includes(item.table))
              .flatMap((item: { table: string; columns: string[] }) =>
                item.columns.map((columnName: string) =>
                  this.firebaseService.deleteColumn(dbName, item.table, columnName),
                ),
              ),
          );
        }
      }

      // mysql에서 최신 정보 조회
      const tableRows = (await this.catalogRepository.getTableCatalogInDb(dbName, connection)) as any[];
      const masterRows = (await this.catalogRepository.getMasterCatalogInDb(dbName, connection)) as any[];
      const dbDataSize = await this.catalogRepository.getDatabaseDataSize(dbName, connection);

      // 컬럼 수 계산
      const tableColumnCount = this.calculateColumnCount(tableRows);

      // 테이블 목록 갱신
      const tableList = masterRows.map((row: any) => row.TABLE_NAME);
      const totalRows = masterRows.reduce((sum: number, row: any) => sum + row.TABLE_ROWS, 0);

      // databases/{dbName} 문서
      const databaseDoc: Partial<DatabaseDoc> = {
        dbSize: dbDataSize,
        totalRows,
        lastUpdated: new Date(),
        tableList,
      };

      // 테이블 및 컬럼 데이터 조립
      const tables = await this.buildTablesDataForUpdate(dbName, masterRows, tableRows, tableColumnCount);

      // Batch로 한 번에 업데이트
      await this.firebaseService.updateCatalogBatch(dbName, databaseDoc, tables);
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /* 업데이트용 테이블 및 컬럼 데이터 조립 */
  private async buildTablesDataForUpdate(
    dbName: string,
    masterRows: any[],
    tableRows: any[],
    tableColumnCount: Record<string, number>,
  ): Promise<{ tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[]> {
    const columnsByTable = this.groupColumnsByTable(tableRows);

    return Promise.all(
      masterRows.map(async (masterRow: any) => {
        const tableName = masterRow.TABLE_NAME;
        const key = `${masterRow.TABLE_SCHEMA}.${tableName}`;

        // 기존 테이블 정보 조회 (description 유지용)
        const existingTable = await this.firebaseService.getTable(dbName, tableName);

        const tableDoc: TableDoc = {
          rows: masterRow.TABLE_ROWS,
          columns: tableColumnCount[key] || 0,
          size: Number(masterRow.DATA_SIZE),
          comment: masterRow.TABLE_COMMENT || '',
          description: existingTable?.description || '',
        };

        // 컬럼 데이터 조립
        const columnsData = columnsByTable[tableName] || [];
        const columns = await Promise.all(
          columnsData.map(async (col: any) => {
            const existingColumn = await this.firebaseService.getColumn(dbName, tableName, col.COLUMN_NAME);

            return {
              columnName: col.COLUMN_NAME,
              columnDoc: {
                type: col.COLUMN_TYPE,
                nullable: col.IS_NULLABLE,
                default: col.COLUMN_DEFAULT,
                key: col.COLUMN_KEY,
                comment: col.COLUMN_COMMENT || '',
                note: existingColumn?.note || '',
              } as ColumnDoc,
            };
          }),
        );

        return { tableName, tableDoc, columns };
      }),
    );
  }

  async updateColumnNote(dbName: string, tableName: string, columnName: string, note: string): Promise<void> {
    await this.firebaseService.updateColumnNote(dbName, tableName, columnName, note);
  }

  async updateTableDescription(dbName: string, tableName: string, description: string): Promise<void> {
    await this.firebaseService.updateTableDescription(dbName, tableName, description);
  }

  /* DB 목록을 조회하는 함수 */
  async getDbList() {
    const databases = await this.firebaseService.getAllDatabases();

    return Promise.all(
      databases.map(async ({ dbName, data }) => {
        const tables = await this.firebaseService.getAllTables(dbName);
        return {
          dbName,
          size: data.dbSize,
          lastUpdate: data.lastUpdated,
          tables: tables.length,
        };
      }),
    );
  }

  /* DB 통계를 조회하는 함수 */
  async getDbStats(dbName: string) {
    const data = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    return {
      dbName,
      lastUpdated: data.lastUpdated,
      dbSize: data.dbSize,
      tableCount: data.tableList.length,
      rows: data.totalRows,
      dbTag: data.dbTag,
    };
  }

  /* 테이블 통계를 조회하는 함수 */
  async getTableStats(dbName: string, tableName: string) {
    const table = await this.firebaseService.getTable(dbName, tableName);
    if (!table) {
      throw new Error(`Table을 찾을 수 없습니다: ${tableName}`);
    }

    return {
      totalColumns: table.columns,
      totalRecords: table.rows,
      tableSize: table.size,
    };
  }

  /* ERD 데이터를 조회하는 함수 */
  async getDatabaseERD(dbName: string) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    const companyCode = dbData.companyCode;
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);

    try {
      const [tables, foreignKeys, primaryKeys] = await Promise.all([
        this.catalogRepository.getMasterCatalogInDb(dbName, connection),
        this.catalogRepository.getForeignKeyRelations(dbName, connection),
        this.catalogRepository.getPrimaryKeys(dbName, connection),
      ]);

      const tableNodes = (tables as any[]).map((table: any) => ({
        id: table.TABLE_NAME,
        name: table.TABLE_NAME,
        comment: table.TABLE_COMMENT || '',
        rows: table.TABLE_ROWS,
        size: table.DATA_SIZE,
      }));

      const relationships = (foreignKeys as any[]).map((fk: any) => ({
        from: fk.TABLE_NAME,
        to: fk.REFERENCED_TABLE_NAME,
        fromColumn: fk.COLUMN_NAME,
        toColumn: fk.REFERENCED_COLUMN_NAME,
        constraintName: fk.CONSTRAINT_NAME,
      }));

      const primaryKeyMap: Record<string, string[]> = {};
      (primaryKeys as any[]).forEach((pk: any) => {
        if (!primaryKeyMap[pk.TABLE_NAME]) {
          primaryKeyMap[pk.TABLE_NAME] = [];
        }
        primaryKeyMap[pk.TABLE_NAME].push(pk.COLUMN_NAME);
      });

      const foreignKeyMap: Record<string, any[]> = {};
      (foreignKeys as any[]).forEach((fk: any) => {
        if (!foreignKeyMap[fk.TABLE_NAME]) {
          foreignKeyMap[fk.TABLE_NAME] = [];
        }
        foreignKeyMap[fk.TABLE_NAME].push({
          column: fk.COLUMN_NAME,
          references: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
          referencedTable: fk.REFERENCED_TABLE_NAME,
          referencedColumn: fk.REFERENCED_COLUMN_NAME,
          constraintName: fk.CONSTRAINT_NAME,
        });
      });

      return {
        tables: tableNodes,
        relationships,
        primaryKeys: primaryKeyMap,
        foreignKeys: foreignKeyMap,
        dbName,
      };
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /* 회사 코드로 DB명을 조회하는 함수 */
  async getCompanyCodeByDbName(dbName: string): Promise<string> {
    const data: DatabaseDoc = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    return data.companyCode;
  }
}
