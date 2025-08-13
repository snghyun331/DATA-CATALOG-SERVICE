import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../module/firebase/firebase.service';

@Injectable()
export class ConnectDBConfig {
  constructor(
    public readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async getDBConfig(companyCode: string) {
    try {
      const dbConnection = await this.firebaseService.getDbConnection(companyCode);
      
      return {
        host: dbConnection.dbHost,
        port: dbConnection.dbPort,
        userName: dbConnection.dbUser,
        password: dbConnection.dbPw,
        dbName: dbConnection.dbName,
      };
    } catch (error) {
      // Fallback to .env if Firestore data not found
      const prefix: string = `DB_${companyCode.toUpperCase()}`;

      return {
        host: this.configService.get<string>(`${prefix}_HOST`),
        port: this.configService.get<number>(`${prefix}_PORT`),
        userName: this.configService.get<string>(`${prefix}_USER`),
        password: this.configService.get<string>(`${prefix}_PW`),
        dbName: this.configService.get<string>(`${prefix}_NAME`),
      };
    }
  }
}
