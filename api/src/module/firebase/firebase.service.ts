import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { serviceAccount } from '../../config/firebase.config';
import { decrypt, encrypt } from '../../common/utils/utility';
import { DatabaseDoc, TableDoc, ColumnDoc } from '../catalog/interface/database.interface';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;
  private readonly CONNECTIONS_COLLECTION = 'dbConnections';
  private readonly DATABASES_COLLECTION = 'databases';
  private readonly TABLES_SUBCOLLECTION = 'tables';
  private readonly COLUMNS_SUBCOLLECTION = 'columns';

  constructor(private readonly configService: ConfigService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount(configService) as admin.ServiceAccount),
      });
    }

    this.firestore = admin.firestore();
  }

  /* Firestore Timestamp를 Date로 변환
     변환 전: lastUpdated: { _seconds: 1704787200, _nanoseconds: 0 }
     변환 후: lastUpdated: new Date(1704787200 * 1000)
  */
  private convertTimestamps<T>(data: T): T {
    if (!data || typeof data !== 'object') return data;

    const result = { ...data } as any;
    for (const key of Object.keys(result)) {
      const value = result[key];
      if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
        result[key] = new Date(value._seconds * 1000);
      }
    }

    return result;
  }

  async saveDatabase(dbName: string, data: DatabaseDoc): Promise<void> {
    await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).set(data, { merge: true });
  }

  async getDatabase(dbName: string): Promise<DatabaseDoc> {
    const doc = await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).get();

    return doc.exists ? this.convertTimestamps(doc.data() as DatabaseDoc) : null;
  }

  async getAllDatabases(): Promise<{ dbName: string; data: DatabaseDoc }[]> {
    const snapshot = await this.firestore.collection(this.DATABASES_COLLECTION).get();

    return snapshot.docs.map((doc) => ({
      dbName: doc.id,
      data: this.convertTimestamps(doc.data() as DatabaseDoc),
    }));
  }

  async isDatabaseExist(dbName: string): Promise<boolean> {
    const doc = await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).get();

    return doc.exists;
  }

  async saveTable(dbName: string, tableName: string, data: TableDoc): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .set(data, { merge: true });
  }

  async getTable(dbName: string, tableName: string): Promise<TableDoc> {
    const doc = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .get();

    return doc.exists ? (doc.data() as TableDoc) : null;
  }

  /* DB의 모든 테이블 목록을 조회하는 함수 */
  async getAllTables(dbName: string): Promise<{ tableName: string; data: TableDoc }[]> {
    const snapshot = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .get();

    return snapshot.docs.map((doc) => ({
      tableName: doc.id,
      data: doc.data() as TableDoc,
    }));
  }

  /* 테이블 삭제 (하위 컬럼 서브컬렉션도 함께 삭제) */
  async deleteTable(dbName: string, tableName: string): Promise<void> {
    // 하위 컬럼 서브컬렉션 먼저 삭제
    await this.deleteAllColumns(dbName, tableName);
    // 테이블 문서 삭제
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .delete();
  }

  async saveColumn(dbName: string, tableName: string, columnName: string, data: ColumnDoc): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .doc(columnName)
      .set(data, { merge: true });
  }

  async getColumn(dbName: string, tableName: string, columnName: string): Promise<ColumnDoc> {
    const doc = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .doc(columnName)
      .get();

    return doc.exists ? (doc.data() as ColumnDoc) : null;
  }

  /* 테이블의 모든 컬럼 목록을 조회하는 함수 */
  async getAllColumns(dbName: string, tableName: string): Promise<{ columnName: string; data: ColumnDoc }[]> {
    const snapshot = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .get();

    return snapshot.docs.map((doc) => ({
      columnName: doc.id,
      data: doc.data() as ColumnDoc,
    }));
  }

  async deleteColumn(dbName: string, tableName: string, columnName: string): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .doc(columnName)
      .delete();
  }

  /* 테이블의 모든 컬럼을 삭제하는 함수 */
  async deleteAllColumns(dbName: string, tableName: string): Promise<void> {
    const snapshot = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .get();

    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }

  async updateColumnNote(dbName: string, tableName: string, columnName: string, note: string): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .doc(columnName)
      .update({ note });
  }

  async updateTableDescription(dbName: string, tableName: string, description: string): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .update({ description });
  }

  /* 데이터베이스의 모든 테이블 서브컬렉션 조회 */
  async getAllTableCollections(dbName: string): Promise<admin.firestore.CollectionReference[]> {
    return await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .listDocuments()
      .then((docs) => docs.map((doc) => doc.collection(this.COLUMNS_SUBCOLLECTION)));
  }

  // ============================================================
  // DB 연결 정보 관련 메서드
  // ============================================================

  async saveDbConnection(companyCode: string, dbInfo: any): Promise<void> {
    const docId = companyCode;
    const { dbPw, ...rest } = dbInfo;
    const encryptedDbInfo = {
      ...rest,
      dbPw: encrypt(dbPw, this.configService),
    };

    await this.firestore.collection(this.CONNECTIONS_COLLECTION).doc(docId).set(encryptedDbInfo, { merge: true });
  }

  async getDbConnection(companyCode: string): Promise<any> {
    const docId = companyCode;
    const docSnapshot = await this.firestore.collection(this.CONNECTIONS_COLLECTION).doc(docId).get();

    if (!docSnapshot.exists) {
      throw new Error(`해당 고객사에 대한 dbConnection 정보가 없습니다: ${companyCode}`);
    }

    const { dbPw, ...rest } = docSnapshot.data();

    return {
      ...rest,
      password: decrypt(dbPw, this.configService),
    };
  }

  // ============================================================
  // Batch 관련 메서드
  // ============================================================

  /* dbConnection + Database + Tables + Columns를 Batch로 한 번에 저장 (원자성 보장) */
  async saveAllBatch(
    companyCode: string,
    dbConnectionData: any,
    dbName: string,
    databaseDoc: DatabaseDoc,
    tables: { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[],
  ): Promise<void> {
    const operations: { ref: admin.firestore.DocumentReference; data: any }[] = [];

    // dbConnection 문서 추가
    const dbConnectionRef = this.firestore.collection(this.CONNECTIONS_COLLECTION).doc(companyCode);
    const { dbPw, ...rest } = dbConnectionData;
    const encryptedDbInfo = {
      ...rest,
      dbPw: encrypt(dbPw, this.configService),
    };
    operations.push({ ref: dbConnectionRef, data: encryptedDbInfo });

    // Database + Tables + Columns 추가
    const catalogOperations = this.buildBatchOperations(dbName, databaseDoc, tables);
    operations.push(...catalogOperations);

    await this.executeBatchInChunks(operations);
  }

  /* Database + Tables + Columns를 Batch로 한 번에 저장 */
  async saveDatabaseBatch(
    dbName: string,
    databaseDoc: DatabaseDoc,
    tables: { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[],
  ): Promise<void> {
    const operations = this.buildBatchOperations(dbName, databaseDoc, tables);
    await this.executeBatchInChunks(operations);
  }

  /* 카탈로그 업데이트를 Batch로 처리 */
  async updateCatalogBatch(
    dbName: string,
    databaseDoc: Partial<DatabaseDoc>,
    tables: { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[],
  ): Promise<void> {
    const operations = this.buildBatchOperations(dbName, databaseDoc as DatabaseDoc, tables);
    await this.executeBatchInChunks(operations);
  }

  /* Batch 작업 목록 생성 */
  private buildBatchOperations(
    dbName: string,
    databaseDoc: DatabaseDoc,
    tables: { tableName: string; tableDoc: TableDoc; columns: { columnName: string; columnDoc: ColumnDoc }[] }[],
  ): { ref: admin.firestore.DocumentReference; data: any }[] {
    const operations: { ref: admin.firestore.DocumentReference; data: any }[] = [];

    // Database 문서
    const dbRef = this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName);
    operations.push({ ref: dbRef, data: databaseDoc });

    // Tables 및 Columns 문서
    tables.forEach(({ tableName, tableDoc, columns }) => {
      const tableRef = dbRef.collection(this.TABLES_SUBCOLLECTION).doc(tableName);
      operations.push({ ref: tableRef, data: tableDoc });

      columns.forEach(({ columnName, columnDoc }) => {
        const columnRef = tableRef.collection(this.COLUMNS_SUBCOLLECTION).doc(columnName);
        operations.push({ ref: columnRef, data: columnDoc });
      });
    });

    return operations;
  }

  /* 500개씩 청크로 나눠서 Batch 실행 */
  private async executeBatchInChunks(
    operations: { ref: admin.firestore.DocumentReference; data: any }[],
  ): Promise<void> {
    const BATCH_LIMIT = 500;
    const chunks = this.chunkArray(operations, BATCH_LIMIT);

    for (const chunk of chunks) {
      const batch = this.firestore.batch();
      chunk.forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
      await batch.commit();
    }
  }

  /* 배열을 지정된 크기로 분할 */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
