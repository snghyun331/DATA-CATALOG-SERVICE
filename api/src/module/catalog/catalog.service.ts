import { ConflictException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';
import { TableColumns } from './interface/catalog.interface';
import { DatabaseDoc, TableDoc, ColumnDoc } from './interface/database.interface';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly catalogRepository: CatalogRepository,
    private readonly connectDBConfig: ConnectDBConfig,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * 마스터 카탈로그 조회 (테이블 목록)
   * 기존 응답 형태 유지: TABLE_SCHEMA, TABLE_NAME 등의 필드 포함
   */
  async getMasterCatalog(dbName: string) {
    const tables = await this.firebaseService.getAllTables(dbName);
    return tables.map(({ tableName, data }) => ({
      TABLE_SCHEMA: dbName,
      TABLE_NAME: tableName,
      TABLE_ROWS: data.rows,
      TABLE_COLUMNS: data.columns,
      TABLE_COMMENT: data.comment,
      TABLE_DESCRIPTION: data.description,
      TABLE_SHEET: data.sheet || '',
      DATA_SIZE: data.size,
    }));
  }

  /**
   * 테이블 카탈로그 조회 (컬럼 목록)
   * 기존 응답 형태 유지
   */
  async getTableCatalog(dbName: string, tableName: string) {
    const columns = await this.firebaseService.getAllColumns(dbName, tableName);
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

  /**
   * 새 DB 등록 및 카탈로그 생성
   */
  async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
    const { companyCode, companyName, ...dbInfo } = dto;

    // DB 연결 정보 저장 (dbConnections 컬렉션 - 유지)
    await this.firebaseService.saveDbConnection(companyCode, dbInfo);

    const connection = await this.catalogRepository.getConnectionToDB(companyCode);
    try {
      // 이미 같은 DB가 저장되었다면 예외처리
      const isCatalogExist = await this.firebaseService.isDatabaseExist(dbInfo.dbName);
      if (isCatalogExist) {
        throw new ConflictException('해당 DB는 이미 추가되었습니다.');
      }

      // MySQL에서 카탈로그 정보 조회
      const tableRows = (await this.catalogRepository.getTableCatalogInDb(dbInfo.dbName, connection)) as any[];
      const masterRows = (await this.catalogRepository.getMasterCatalogInDb(dbInfo.dbName, connection)) as any[];
      const dbDataSize = await this.catalogRepository.getDatabaseDataSize(dbInfo.dbName, connection);

      // 컬럼 수 계산
      const tableColumnCount = this.calculateColumnCount(tableRows);

      // 테이블 목록 생성
      const tableList = masterRows.map((row: any) => row.TABLE_NAME);
      const totalRows = masterRows.reduce((sum: number, row: any) => sum + row.TABLE_ROWS, 0);

      // databases/{dbName} 문서 저장
      const databaseDoc: DatabaseDoc = {
        companyCode,
        companyName,
        dbSize: dbDataSize,
        totalRows,
        lastUpdated: new Date(),
        tableList,
        ...(dto.dbTag && { dbTag: dto.dbTag }),
      };
      await this.firebaseService.saveDatabase(dbInfo.dbName, databaseDoc);

      // 테이블 및 컬럼 저장
      await this.saveTablesAndColumns(dbInfo.dbName, masterRows, tableRows, tableColumnCount);
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * 테이블 및 컬럼 데이터 저장
   */
  private async saveTablesAndColumns(
    dbName: string,
    masterRows: any[],
    tableRows: any[],
    tableColumnCount: Record<string, number>,
  ): Promise<void> {
    // 테이블별로 그룹화
    const columnsByTable = this.groupColumnsByTable(tableRows);

    await Promise.all(
      masterRows.map(async (masterRow: any) => {
        const tableName = masterRow.TABLE_NAME;
        const key = `${masterRow.TABLE_SCHEMA}.${tableName}`;

        // 테이블 문서 저장
        const tableDoc: TableDoc = {
          rows: masterRow.TABLE_ROWS,
          columns: tableColumnCount[key] || 0,
          size: Number(masterRow.DATA_SIZE),
          comment: masterRow.TABLE_COMMENT || '',
          description: '',
          sheet: '',
        };
        await this.firebaseService.saveTable(dbName, tableName, tableDoc);

        // 해당 테이블의 컬럼들 저장
        const columns = columnsByTable[tableName] || [];
        await Promise.all(
          columns.map(async (col: any) => {
            const columnDoc: ColumnDoc = {
              type: col.COLUMN_TYPE,
              nullable: col.IS_NULLABLE,
              default: col.COLUMN_DEFAULT,
              key: col.COLUMN_KEY,
              comment: col.COLUMN_COMMENT || '',
              note: '',
            };
            await this.firebaseService.saveColumn(dbName, tableName, col.COLUMN_NAME, columnDoc);
          }),
        );
      }),
    );
  }

  /**
   * 컬럼 수 계산
   */
  private calculateColumnCount(tableRows: any[]): Record<string, number> {
    const count: Record<string, number> = {};
    tableRows.forEach((row: any) => {
      const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
      count[key] = (count[key] || 0) + 1;
    });
    return count;
  }

  /**
   * 테이블별 컬럼 그룹화
   */
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

  /**
   * 스키마 변경 감지
   */
  async detectChanges(dbName: string) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database not found: ${dbName}`);
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

  /**
   * 스키마 비교
   */
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

  /**
   * 테이블명으로 그룹화
   */
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

  /**
   * 카탈로그 업데이트
   */
  async updateCatalog(dbName: string, diffData?: any) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database not found: ${dbName}`);
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

      // MySQL에서 최신 스키마 조회
      const tableRows = (await this.catalogRepository.getTableCatalogInDb(dbName, connection)) as any[];
      const masterRows = (await this.catalogRepository.getMasterCatalogInDb(dbName, connection)) as any[];
      const dbDataSize = await this.catalogRepository.getDatabaseDataSize(dbName, connection);

      // 컬럼 수 계산
      const tableColumnCount = this.calculateColumnCount(tableRows);

      // 테이블 목록 갱신
      const tableList = masterRows.map((row: any) => row.TABLE_NAME);
      const totalRows = masterRows.reduce((sum: number, row: any) => sum + row.TABLE_ROWS, 0);

      // databases/{dbName} 문서 업데이트
      const databaseDoc: Partial<DatabaseDoc> = {
        dbSize: dbDataSize,
        totalRows,
        lastUpdated: new Date(),
        tableList,
      };
      await this.firebaseService.saveDatabase(dbName, databaseDoc as DatabaseDoc);

      // 테이블 및 컬럼 저장 (기존 description, note는 유지)
      await this.updateTablesAndColumns(dbName, masterRows, tableRows, tableColumnCount);
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * 테이블 및 컬럼 업데이트 (기존 사용자 입력 필드 유지)
   */
  private async updateTablesAndColumns(
    dbName: string,
    masterRows: any[],
    tableRows: any[],
    tableColumnCount: Record<string, number>,
  ): Promise<void> {
    const columnsByTable = this.groupColumnsByTable(tableRows);

    await Promise.all(
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
          sheet: existingTable?.sheet || '',
        };
        await this.firebaseService.saveTable(dbName, tableName, tableDoc);

        // 컬럼 업데이트
        const columns = columnsByTable[tableName] || [];
        await Promise.all(
          columns.map(async (col: any) => {
            // 기존 컬럼 정보 조회 (note 유지용)
            const existingColumn = await this.firebaseService.getColumn(dbName, tableName, col.COLUMN_NAME);

            const columnDoc: ColumnDoc = {
              type: col.COLUMN_TYPE,
              nullable: col.IS_NULLABLE,
              default: col.COLUMN_DEFAULT,
              key: col.COLUMN_KEY,
              comment: col.COLUMN_COMMENT || '',
              note: existingColumn?.note || '',
            };
            await this.firebaseService.saveColumn(dbName, tableName, col.COLUMN_NAME, columnDoc);
          }),
        );
      }),
    );
  }

  /**
   * 컬럼 노트 업데이트
   */
  async updateColumnNote(dbName: string, tableName: string, columnName: string, note: string): Promise<void> {
    await this.firebaseService.updateColumnNoteNew(dbName, tableName, columnName, note);
  }

  /**
   * 테이블 설명 업데이트
   */
  async updateTableDescription(dbName: string, tableName: string, description: string): Promise<void> {
    await this.firebaseService.updateTableDescriptionNew(dbName, tableName, description);
  }

  /**
   * DB 목록 조회
   */
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

  /**
   * DB 통계 조회
   */
  async getDbStats(dbName: string) {
    const data = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database not found: ${dbName}`);
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

  /**
   * 테이블 통계 조회
   */
  async getTableStats(dbName: string, tableName: string) {
    const table = await this.firebaseService.getTable(dbName, tableName);
    if (!table) {
      throw new Error(`Table not found: ${tableName}`);
    }

    return {
      totalColumns: table.columns,
      totalRecords: table.rows,
      tableSize: table.size,
    };
  }

  /**
   * ERD 데이터 조회
   */
  async getDatabaseERD(dbName: string) {
    const dbData = await this.firebaseService.getDatabase(dbName);
    if (!dbData) {
      throw new Error(`Database not found: ${dbName}`);
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

  /**
   * 회사 코드로 DB명 조회 (CompanyService 대체)
   */
  async getCompanyCodeByDbName(dbName: string): Promise<string> {
    const data = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database not found: ${dbName}`);
    }
    return data.companyCode;
  }
}
