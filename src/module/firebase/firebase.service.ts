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

  // JSON 데이터 저장
  async saveDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    await this.firestore.collection(collectionName).doc(documentId).set(data);
  }

  // 자동으로 docId 생성해서 저장
  async addDocument(collectionName: string, data: any): Promise<string> {
    const docRef = await this.firestore.collection(collectionName).add(data);
    return docRef.id;
  }
}
