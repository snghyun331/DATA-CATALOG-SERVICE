import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { serviceAccount } from '../../config/firebase.config';
import { decrypt, encrypt } from '../../common/utils/utility';
import { DatabaseDoc, TableDoc, ColumnDoc } from '../catalog/interface/database.interface';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;
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

  // ============================================================
  // 새로운 통합 구조 메서드 (databases/{dbName}/tables/{tableName}/columns/{columnName})
  // ============================================================

  /**
   * 데이터베이스 문서 저장
   */
  async saveDatabase(dbName: string, data: DatabaseDoc): Promise<void> {
    await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).set(data, { merge: true });
  }

  /**
   * 데이터베이스 문서 조회
   */
  async getDatabase(dbName: string): Promise<DatabaseDoc | null> {
    const doc = await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).get();
    return doc.exists ? (doc.data() as DatabaseDoc) : null;
  }

  /**
   * 모든 데이터베이스 목록 조회
   */
  async getAllDatabases(): Promise<{ dbName: string; data: DatabaseDoc }[]> {
    const snapshot = await this.firestore.collection(this.DATABASES_COLLECTION).get();
    return snapshot.docs.map((doc) => ({
      dbName: doc.id,
      data: doc.data() as DatabaseDoc,
    }));
  }

  /**
   * 데이터베이스 존재 여부 확인
   */
  async isDatabaseExist(dbName: string): Promise<boolean> {
    const doc = await this.firestore.collection(this.DATABASES_COLLECTION).doc(dbName).get();
    return doc.exists;
  }

  /**
   * 테이블 문서 저장
   */
  async saveTable(dbName: string, tableName: string, data: TableDoc): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .set(data, { merge: true });
  }

  /**
   * 테이블 문서 조회
   */
  async getTable(dbName: string, tableName: string): Promise<TableDoc | null> {
    const doc = await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .get();
    return doc.exists ? (doc.data() as TableDoc) : null;
  }

  /**
   * 데이터베이스의 모든 테이블 목록 조회
   */
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

  /**
   * 테이블 삭제 (하위 컬럼 서브컬렉션도 함께 삭제)
   */
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

  /**
   * 컬럼 문서 저장
   */
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

  /**
   * 컬럼 문서 조회
   */
  async getColumn(dbName: string, tableName: string, columnName: string): Promise<ColumnDoc | null> {
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

  /**
   * 테이블의 모든 컬럼 목록 조회
   */
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

  /**
   * 컬럼 삭제
   */
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

  /**
   * 테이블의 모든 컬럼 삭제
   */
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

  /**
   * 컬럼 노트 업데이트
   */
  async updateColumnNoteNew(dbName: string, tableName: string, columnName: string, note: string): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .collection(this.COLUMNS_SUBCOLLECTION)
      .doc(columnName)
      .update({ note });
  }

  /**
   * 테이블 설명 업데이트
   */
  async updateTableDescriptionNew(dbName: string, tableName: string, description: string): Promise<void> {
    await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .doc(tableName)
      .update({ description });
  }

  /**
   * 데이터베이스의 모든 테이블 서브컬렉션 조회 (스키마 비교용)
   */
  async getAllTableCollections(dbName: string): Promise<admin.firestore.CollectionReference[]> {
    return await this.firestore
      .collection(this.DATABASES_COLLECTION)
      .doc(dbName)
      .collection(this.TABLES_SUBCOLLECTION)
      .listDocuments()
      .then((docs) => docs.map((doc) => doc.collection(this.COLUMNS_SUBCOLLECTION)));
  }

  // ============================================================
  // DB 연결 정보 관련 메서드 (dbConnections 컬렉션 - 유지)
  // ============================================================

  async saveDbConnection(companyCode: string, dbInfo: any): Promise<void> {
    const collection = 'dbConnections';
    const docId = companyCode;
    const encryptedDbInfo = {
      ...dbInfo,
      password: encrypt(dbInfo.password),
    };
    await this.firestore.collection(collection).doc(docId).set(encryptedDbInfo, { merge: true });
  }

  async getDbConnection(companyCode: string): Promise<any> {
    const collection = 'dbConnections';
    const docId = companyCode;
    const docSnapshot = await this.firestore.collection(collection).doc(docId).get();

    if (!docSnapshot.exists) {
      throw new Error(`DB connection info not found for company: ${companyCode}`);
    }

    const data = docSnapshot.data();
    return {
      ...data,
      password: decrypt(data.password),
    };
  }

  // ============================================================
  // 기존 메서드들 (하위 호환성을 위해 유지 - 추후 제거 예정)
  // ============================================================

  async checkIfDocDataExist(collection: string, docId: string): Promise<boolean> {
    const docSnapShot = await this.firestore.collection(collection).doc(docId).get();
    return docSnapShot.exists;
  }

  async getCollectonData(collection: string) {
    const data = await this.firestore.collection(collection).get();
    return data;
  }

  async getAllSubCollections(collection: string, docId: string) {
    const collections = await this.firestore.collection(collection).doc(docId).listCollections();
    return collections;
  }

  async getSubCollectionData(mainCollection: string, docId: string, subCollection: string) {
    const data = await this.firestore.collection(mainCollection).doc(docId).collection(subCollection).get();
    return data;
  }

  async getMainDocData(mainCol: string, mainDoc: string) {
    const data = await this.firestore.collection(mainCol).doc(mainDoc).get();
    return data;
  }

  async getDocRef(collection: string, docId: string) {
    const ref = this.firestore.collection(collection).doc(docId);
    return ref;
  }

  async setDocument(collection: string, docId: string, data: any): Promise<void> {
    await this.firestore.collection(collection).doc(docId).set(data, { merge: true });
  }

  async saveDocumentUsingRef(ref: any, collection: string, docId: string, data: any): Promise<void> {
    await ref.collection(collection).doc(docId).set(data, { merge: true });
  }

  async setSubCollectionData(
    mainCol: string,
    mainDoc: string,
    subCol: string,
    subDoc: string,
    data: any,
  ): Promise<void> {
    await this.firestore.collection(mainCol).doc(mainDoc).collection(subCol).doc(subDoc).set(data, { merge: true });
  }

  async updateColumnNote(
    collection: string,
    docId: string,
    subCollection: string,
    subDocId: string,
    data: string,
  ): Promise<void> {
    await this.firestore
      .collection(collection)
      .doc(docId)
      .collection(subCollection)
      .doc(subDocId)
      .update({ COLUMN_NOTE: data });
  }

  async updateTableDescription(
    collection: string,
    docId: string,
    subCollection: string,
    subDocId: string,
    data: string,
  ): Promise<void> {
    await this.firestore
      .collection(collection)
      .doc(docId)
      .collection(subCollection)
      .doc(subDocId)
      .update({ TABLE_DESCRIPTION: data });
  }

  async deleteSubDoc(collection: string, docId: string, subCollection: string, subDocId: string): Promise<any> {
    await this.firestore.collection(collection).doc(docId).collection(subCollection).doc(subDocId).delete();
  }

  async deleteSubCollection(collection: string, docId: string, subCollection: string): Promise<any> {
    const subCollectionRef = this.firestore.collection(collection).doc(docId).collection(subCollection);
    const snapshot = await subCollectionRef.get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
}
