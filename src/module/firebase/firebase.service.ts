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

  async checkIfCatalogExist(collection: string, schema: string): Promise<boolean> {
    const docSnapShot = await this.firestore.collection(collection).doc(schema).get();

    return docSnapShot.exists;
  }

  async saveDocument(collection: string, docId: string, data: any): Promise<void> {
    await this.firestore.collection(collection).doc(docId).set(data, { merge: true });

    return;
  }

  async saveDocumentUsingRef(ref: any, collection: string, docId: string, data: any): Promise<void> {
    await ref.collection(collection).doc(docId).set(data, { merge: true });

    return;
  }

  async getDocRef(collection: string, docId: string) {
    return this.firestore.collection(collection).doc(docId);
  }
}
