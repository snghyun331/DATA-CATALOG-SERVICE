import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConnectDBConfig {
  constructor(public readonly configService: ConfigService) {}

  async getDBConfig(companyName: string) {
    const prefix: string = `DB_${companyName.toUpperCase()}`;

    return {
      host: this.configService.get<string>(`${prefix}_HOST`),
      port: this.configService.get<number>(`${prefix}_PORT`),
      userName: this.configService.get<string>(`${prefix}_USER`),
      password: this.configService.get<string>(`${prefix}_PW`),
      dbName: this.configService.get<string>(`${prefix}_NAME`),
    };
  }
}
