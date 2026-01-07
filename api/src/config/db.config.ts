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
        password: dbConnection.password,
        dbName: dbConnection.dbName,
      };
    } catch (err) {
      console.error(err);
    }
  }
}
