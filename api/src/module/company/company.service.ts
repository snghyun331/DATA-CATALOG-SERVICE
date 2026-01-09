import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { DatabaseDoc } from '../catalog/interface/database.interface';

@Injectable()
export class CompanyService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getAllCompanies() {
    const databases: { dbName: string; data: DatabaseDoc }[] = await this.firebaseService.getAllDatabases();

    return databases.map(({ dbName, data }) => ({
      companyCode: data.companyCode,
      companyName: data.companyName,
      dbName,
    }));
  }

  async getCompanyCodeByDbName(dbName: string): Promise<string> {
    const data: DatabaseDoc = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database를 찾을 수 없습니다: ${dbName}`);
    }

    return data.companyCode;
  }
}
