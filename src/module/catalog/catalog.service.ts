import { ConflictException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';
import { updateEnvFile } from '../../common/utils/utility';
import { TableColumns } from './interface/catalog.interface';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly catalogRepository: CatalogRepository,
    private readonly connectDBConfig: ConnectDBConfig,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getMasterCatalog(companyCode: string) {
    const dbConfig = await this.connectDBConfig.getDBConfig(companyCode);
    const mainCollection = 'masterCatalog';
    const subCollection = 'tables';
    const schema = dbConfig.dbName;
    const snapshot = await this.firebaseService.getSubCollectionData(mainCollection, schema, subCollection);
    const result = snapshot.docs.map((doc) => doc.data());

    return result;
  }

  async getTableCatalog(companyCode: string, tableName: string) {
    const dbConfig = await this.connectDBConfig.getDBConfig(companyCode);
    const mainCollection = 'tableCatalog';
    const schema = dbConfig.dbName;
    const snapshot = await this.firebaseService.getSubCollectionData(mainCollection, schema, tableName);
    const result = snapshot.docs.map((doc) => doc.data());

    return result;
  }

  async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
    const { companyCode, companyName, ...dbInfo } = dto;

    /* 입력받은 정보를 .env에 저장 */
    const envFormatted = {
      [`DB_${companyCode}_HOST`]: dbInfo.dbHost,
      [`DB_${companyCode}_PORT`]: dbInfo.dbPort,
      [`DB_${companyCode}_USER`]: dbInfo.dbUser,
      [`DB_${companyCode}_NAME`]: dbInfo.dbName,
      [`DB_${companyCode}_PW`]: dbInfo.dbPw,
    };
    updateEnvFile(envFormatted);

    /* DB로부터 Catalog 정보 불러오기 & 모두 firebase에 저장 */
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);
    try {
      // 이미 같은 DB를 저장했다면 예외처리
      const isCatalogExist: boolean = await this.firebaseService.checkIfDocDataExist('masterCatalog', dbInfo.dbName);
      if (isCatalogExist) {
        throw new ConflictException('해당 DB는 이미 추가되었습니다.');
      }

      // 고객사 정보를 firebase에 저장
      await this.saveCompanyInfoInFirebase(companyCode, companyName);

      // catalog 정보 불러오기
      const tableRows = await this.catalogRepository.getTableCatalogInDb(dbInfo.dbName, connection);
      const masterRows = await this.catalogRepository.getMasterCatalogInDb(dbInfo.dbName, connection);
      // table / master row 재구성
      const finalTableRows = await this.handleTableRows(tableRows);
      const finalMasterRows = await this.handleMasterRows(tableRows, masterRows);
      // firebase에 저장
      await this.saveTableRowsInFirebase(finalTableRows);
      await this.saveMasterRowsInFirebase(finalMasterRows);
      // 캐싱
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      connection.release();
    }
  }

  private async saveCompanyInfoInFirebase(companyCode: string, companyName: string) {
    const collection = 'company';
    const data = { companyCode, companyName };

    await this.firebaseService.setDocument(collection, companyCode, data);
  }

  private async handleMasterRows(tableRows: any, masterRows: any) {
    // 컬럼 수 계산
    const tableColumnCount = {};
    await Promise.all(
      tableRows.map(async (tableRow: any) => {
        const key: string = `${tableRow.TABLE_SCHEMA}.${tableRow.TABLE_NAME}`;
        if (tableColumnCount[key] === undefined) {
          tableColumnCount[key] = 1;
        } else {
          tableColumnCount[key] += 1;
        }
      }),
    );

    // master catalog 구조 재구성
    const finalMasterRows = await Promise.all(
      masterRows.map(async (masterRow: any) => {
        const key: string = `${masterRow.TABLE_SCHEMA}.${masterRow.TABLE_NAME}`;

        return {
          TABLE_SCHEMA: masterRow.TABLE_SCHEMA,
          TABLE_NAME: masterRow.TABLE_NAME,
          TABLE_ROWS: masterRow.TABLE_ROWS,
          TABLE_COLUMNS: tableColumnCount[key] || 0,
          TABLE_COMMENT: masterRow.TABLE_COMMENT,
          TABLE_DESCRIPTION: '',
          TABLE_SHEET: '',
        };
      }),
    );

    return finalMasterRows;
  }

  private async handleTableRows(tableRows: any) {
    // table Catalog 구조 재구성
    const finalTableRows = await Promise.all(
      tableRows.map(async (tableRow: any) => {
        return {
          TABLE_SCHEMA: tableRow.TABLE_SCHEMA,
          TABLE_NAME: tableRow.TABLE_NAME,
          COLUMN_NAME: tableRow.COLUMN_NAME,
          COLUMN_DEFAULT: tableRow.COLUMN_DEFAULT,
          IS_NULLABLE: tableRow.IS_NULLABLE,
          COLUMN_TYPE: tableRow.COLUMN_TYPE,
          COLUMN_KEY: tableRow.COLUMN_KEY,
          COLUMN_COMMENT: tableRow.COLUMN_COMMENT,
          COLUMN_NOTE: '',
        };
      }),
    );

    return finalTableRows;
  }

  private async saveTableRowsInFirebase(tableRows: any) {
    const mainCollection = 'tableCatalog';
    const schema = tableRows[0].TABLE_SCHEMA;
    await this.firebaseService.setDocument(mainCollection, schema, { updatedAt: new Date() });

    const dbDocRef = await this.firebaseService.getDocRef(mainCollection, schema);
    await Promise.all(
      tableRows.map(async (tableRow: any) => {
        const subCollection = tableRow.TABLE_NAME;
        const subDocId = tableRow.COLUMN_NAME;
        await this.firebaseService.saveDocumentUsingRef(dbDocRef, subCollection, subDocId, tableRow);
      }),
    );
  }

  private async saveMasterRowsInFirebase(masterRows: any) {
    const mainCollection = 'masterCatalog';
    const schema = masterRows[0].TABLE_SCHEMA;
    await this.firebaseService.setDocument(mainCollection, schema, { updatedAt: new Date() });

    const dbDocRef = await this.firebaseService.getDocRef(mainCollection, schema);
    await Promise.all(
      masterRows.map(async (masterRow: any) => {
        const subCollection = 'tables';
        const subDocId = masterRow.TABLE_NAME;
        await this.firebaseService.saveDocumentUsingRef(dbDocRef, subCollection, subDocId, masterRow);
      }),
    );
  }

  async detectChanges(companyCode: string) {
    const dbConfig = await this.connectDBConfig.getDBConfig(companyCode);
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);
    try {
      const newSchema: TableColumns[] = (await this.catalogRepository.getTableCatalogInDb(
        dbConfig.dbName,
        connection,
      )) as TableColumns[];
      const collection = 'tableCatalog';
      const docId = dbConfig.dbName;
      const subCollections = await this.firebaseService.getAllSubCollections(collection, docId);
      const oldSchema: TableColumns[][] = await Promise.all(
        subCollections.map(async (subCollection) => {
          const snapshot = await subCollection.get();
          const docs: TableColumns[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              TABLE_SCHEMA: data.TABLE_SCHEMA,
              TABLE_NAME: data.TABLE_NAME,
              COLUMN_NAME: data.COLUMN_NAME,
              COLUMN_DEFAULT: data.COLUMN_DEFAULT,
              IS_NULLABLE: data.IS_NULLABLE,
              COLUMN_TYPE: data.COLUMN_TYPE,
              COLUMN_KEY: data.COLUMN_KEY,
              COLUMN_COMMENT: data.COLUMN_COMMENT,
            };
          });

          return docs;
        }),
      );

      const result = await this.compareSchemas(newSchema, oldSchema.flat());

      return result;
    } catch (err) {
      this.logger.error(err);
    } finally {
      connection.release();
    }
  }

  private async compareSchemas(newSchema: TableColumns[], oldSchema: TableColumns[]) {
    const result = {
      changed: false,
      tables: {
        changed: false,
        added: [] as { table: string }[],
        deleted: [] as { table: string }[],
      },
      columns: {
        changed: false,
        added: [] as { table: string }[],
        deleted: [] as { table: string }[],
        updated: [] as { table: string }[],
      },
    };

    const oldTables = await this.groupByTableName(oldSchema);
    const newTables = await this.groupByTableName(newSchema);

    // 모든 테이블 이름을 하나로 모음
    const allTableNames = Array.from(new Set([...Object.keys(oldTables), ...Object.keys(newTables)]));

    await Promise.all(
      allTableNames.map(async (tableName) => {
        const oldColumns = oldTables[tableName] || [];
        const newColumns = newTables[tableName] || [];

        // ▶ 테이블 추가 감지
        if (oldColumns.length === 0 && newColumns.length > 0) {
          result.tables.added.push({ table: tableName });
          result.tables.changed = true;
          result.changed = true;
        }

        // ▶ 테이블 삭제 감지
        if (newColumns.length === 0 && oldColumns.length > 0) {
          result.tables.deleted.push({ table: tableName });
          result.tables.changed = true;
          result.changed = true;
        }

        // 컬럼 이름 목록 정리
        const oldColNames = oldColumns.map((col) => col.COLUMN_NAME);
        const newColNames = newColumns.map((col) => col.COLUMN_NAME);

        // ▶ 컬럼 추가
        const added = newColNames.filter((name) => !oldColNames.includes(name));
        if (added.length > 0) {
          result.columns.added.push({ table: tableName });
          result.columns.changed = true;
          result.changed = true;
        }

        // ▶ 컬럼 삭제
        const deleted = oldColNames.filter((name) => !newColNames.includes(name));
        if (deleted.length > 0) {
          result.columns.deleted.push({ table: tableName });
          result.columns.changed = true;
          result.changed = true;
        }

        // ▶ 컬럼 수정
        const updated = newColNames.filter((name) => {
          const oldCol = oldColumns.find((c) => c.COLUMN_NAME === name);
          const newCol = newColumns.find((c) => c.COLUMN_NAME === name);
          return (
            oldCol && newCol && (oldCol.COLUMN_TYPE !== newCol.COLUMN_TYPE || oldCol.IS_NULLABLE !== newCol.IS_NULLABLE)
          );
        });

        if (updated.length > 0) {
          result.columns.updated.push({ table: tableName });
          result.columns.changed = true;
          result.changed = true;
        }
      }),
    );

    return result;
  }

  private async groupByTableName(schema: TableColumns[]) {
    const result = {};

    await Promise.all(
      schema.map(async (row) => {
        const table = row.TABLE_NAME;
        if (!result[table]) {
          result[table] = [];
        }
        result[table].push(row);
      }),
    );

    return result;
  }

  async updateCatalog(companyCode: string) {
    const dbConfig = await this.connectDBConfig.getDBConfig(companyCode);

    /* DB로부터 Catalog 정보 불러오기 & 모두 firebase에 저장 */
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);
    try {
      // catalog 정보 불러오기
      const tableRows = await this.catalogRepository.getTableCatalogInDb(dbConfig.dbName, connection);
      const masterRows = await this.catalogRepository.getMasterCatalogInDb(dbConfig.dbName, connection);
      // table / master row 재구성
      const finalTableRows = await this.updateTableRows(tableRows);
      const finalMasterRows = await this.updateMasterRows(tableRows, masterRows);
      // firebase에 저장
      await this.saveTableRowsInFirebase(finalTableRows);
      await this.saveMasterRowsInFirebase(finalMasterRows);
      // 캐싱
    } catch (err) {
      this.logger.error(err);
    } finally {
      connection.release();
    }
  }

  private async updateMasterRows(tableRows: any, masterRows: any) {
    // 컬럼 수 계산
    const tableColumnCount = {};
    await Promise.all(
      tableRows.map(async (tableRow: any) => {
        const key: string = `${tableRow.TABLE_SCHEMA}.${tableRow.TABLE_NAME}`;
        if (tableColumnCount[key] === undefined) {
          tableColumnCount[key] = 1;
        } else {
          tableColumnCount[key] += 1;
        }
      }),
    );

    // master catalog 구조 재구성
    const finalMasterRows = await Promise.all(
      masterRows.map(async (masterRow: any) => {
        const key: string = `${masterRow.TABLE_SCHEMA}.${masterRow.TABLE_NAME}`;

        return {
          TABLE_SCHEMA: masterRow.TABLE_SCHEMA,
          TABLE_NAME: masterRow.TABLE_NAME,
          TABLE_ROWS: masterRow.TABLE_ROWS,
          TABLE_COLUMNS: tableColumnCount[key] || 0,
          TABLE_COMMENT: masterRow.TABLE_COMMENT,
          TABLE_SHEET: '',
        };
      }),
    );

    return finalMasterRows;
  }

  private async updateTableRows(tableRows: any) {
    // table Catalog 구조 재구성
    const finalTableRows = await Promise.all(
      tableRows.map(async (tableRow: any) => {
        return {
          TABLE_SCHEMA: tableRow.TABLE_SCHEMA,
          TABLE_NAME: tableRow.TABLE_NAME,
          COLUMN_NAME: tableRow.COLUMN_NAME,
          COLUMN_DEFAULT: tableRow.COLUMN_DEFAULT,
          IS_NULLABLE: tableRow.IS_NULLABLE,
          COLUMN_TYPE: tableRow.COLUMN_TYPE,
          COLUMN_KEY: tableRow.COLUMN_KEY,
          COLUMN_COMMENT: tableRow.COLUMN_COMMENT,
        };
      }),
    );

    return finalTableRows;
  }
}
