import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { serviceAccount } from '../../config/firebase.config';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;

  constructor(private readonly configService: ConfigService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount(configService) as admin.ServiceAccount),
      });
    }

    this.firestore = admin.firestore();
  }

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

    return;
  }

  async saveDocumentUsingRef(ref: any, collection: string, docId: string, data: any): Promise<void> {
    await ref.collection(collection).doc(docId).set(data, { merge: true });

    return;
  }

  async setSubCollectionData(
    mainCol: string,
    mainDoc: string,
    subCol: string,
    subDoc: string,
    data: any,
  ): Promise<void> {
    await this.firestore.collection(mainCol).doc(mainDoc).collection(subCol).doc(subDoc).set(data, { merge: true });

    return;
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

    return;
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

    return;
  }

  async saveDbConnection(companyCode: string, dbInfo: any): Promise<void> {
    const collection = 'dbConnections';
    const docId = companyCode;
    await this.firestore.collection(collection).doc(docId).set(dbInfo, { merge: true });

    return;
  }

  async getDbConnection(companyCode: string): Promise<any> {
    const collection = 'dbConnections';
    const docId = companyCode;
    const docSnapshot = await this.firestore.collection(collection).doc(docId).get();

    if (!docSnapshot.exists) {
      throw new Error(`DB connection info not found for company: ${companyCode}`);
    }

    return docSnapshot.data();
  }

  async deleteSubDoc(collection: string, docId: string, subCollection: string, subDocId: string): Promise<any> {
    await this.firestore.collection(collection).doc(docId).collection(subCollection).doc(subDocId).delete();

    return;
  }

  async deleteSubCollection(collection: string, docId: string, subCollection: string): Promise<any> {
    const subCollectionRef = this.firestore.collection(collection).doc(docId).collection(subCollection);
    const snapshot = await subCollectionRef.get();

    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));

    return;
  }
}
