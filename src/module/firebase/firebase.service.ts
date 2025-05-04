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

  async getSubCollectionData(mainCollection: string, docId: string, subCollection: string) {
    const data = await this.firestore.collection(mainCollection).doc(docId).collection(subCollection).get();

    return data;
  }

  async getSubDocData(mainCollection: string, mainDocId: string, subCollection: string, subDocId: string) {
    const data = await this.firestore
      .collection(mainCollection)
      .doc(mainDocId)
      .collection(subCollection)
      .doc(subDocId)
      .get();

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

  async addDocumentUsingRef(ref: any, collection: string, data: any): Promise<void> {
    await ref.collection(collection).add(data);

    return;
  }
}
