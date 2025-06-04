import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class CompanyService {
  constructor(private readonly firebaseServie: FirebaseService) {}

  async getAllCompanies() {
    const collection = 'company';
    const snapshot = await this.firebaseServie.getCollectonData(collection);
    const result = snapshot.docs.map((doc) => doc.data());

    return result;
  }

  async getCompanyCodeByDbName(dbName: string) {
    const collection = 'company';
    const snapshot = await this.firebaseServie.getMainDocData(collection, dbName);
    const data = snapshot.data();

    return data.companyCode;
  }
}
