import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class CompanyService {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * 모든 회사 목록 조회
   * databases 컬렉션에서 companyCode, companyName 추출
   */
  async getAllCompanies() {
    const databases = await this.firebaseService.getAllDatabases();
    return databases.map(({ dbName, data }) => ({
      companyCode: data.companyCode,
      companyName: data.companyName,
      dbName,
    }));
  }

  /**
   * DB명으로 회사 코드 조회
   */
  async getCompanyCodeByDbName(dbName: string): Promise<string> {
    const data = await this.firebaseService.getDatabase(dbName);
    if (!data) {
      throw new Error(`Database not found: ${dbName}`);
    }
    return data.companyCode;
  }
}
