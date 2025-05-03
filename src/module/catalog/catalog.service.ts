import { ConflictException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';
import { updateEnvFile } from '../../common/utils/utility';

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

  async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
    const { companyCode, companyName, ...dbInfo } = dto;

    /* 이미 같은 DB를 저장했다면 예외처리 */
    const isCatalogExist: boolean = await this.firebaseService.checkIfDocDataExist('masterCatalog', dbInfo.dbName);
    if (isCatalogExist) {
      throw new ConflictException('해당 DB는 이미 추가되었습니다.');
    }

    /* 입력받은 정보를 .env에 저장 */
    const envFormatted = {
      [`DB_${companyCode}_HOST`]: dbInfo.dbHost,
      [`DB_${companyCode}_PORT`]: dbInfo.dbPort,
      [`DB_${companyCode}_USER`]: dbInfo.dbUser,
      [`DB_${companyCode}_NAME`]: dbInfo.dbName,
      [`DB_${companyCode}_PW`]: dbInfo.dbPw,
    };
    updateEnvFile(envFormatted);

    /* 고객사 정보를 firebase에 저장 */
    await this.saveCompanyInfoInFirebase(companyCode, companyName);

    /* DB로부터 Catalog 정보 불러오기 & 모두 firebase에 저장 */
    const connection = await this.catalogRepository.getConnectionToDB(companyCode);
    try {
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
    } finally {
      connection.release();
    }
  }

  private async saveCompanyInfoInFirebase(companyCode: string, companyName: string) {
    const collection = 'company';
    const data = { companyCode, companyName };

    await this.firebaseService.saveDocument(collection, companyCode, data);
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
    await this.firebaseService.saveDocument(mainCollection, schema, { updatedAt: new Date() });

    const dbDocRef = await this.firebaseService.getDocRef(mainCollection, schema);
    await Promise.all(
      tableRows.map(async (tableRow: any) => {
        const subCollection = 'tables';
        const table = tableRow.TABLE_NAME;
        await this.firebaseService.saveDocumentUsingRef(dbDocRef, subCollection, table, tableRow);
      }),
    );
  }

  private async saveMasterRowsInFirebase(masterRows: any) {
    const mainCollection = 'masterCatalog';
    const schema = masterRows[0].TABLE_SCHEMA;
    await this.firebaseService.saveDocument(mainCollection, schema, { updatedAt: new Date() });

    const dbDocRef = await this.firebaseService.getDocRef(mainCollection, schema);
    await Promise.all(
      masterRows.map(async (masterRow: any) => {
        const subCollection = 'tables';
        const table = masterRow.TABLE_NAME;
        await this.firebaseService.saveDocumentUsingRef(dbDocRef, subCollection, table, masterRow);
      }),
    );
  }
}
