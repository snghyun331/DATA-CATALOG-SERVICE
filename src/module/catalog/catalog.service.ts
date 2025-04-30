import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly connectDBConfig: ConnectDBConfig,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(companyName: string) {
    const connection = await this.catalogRepository.getConnectionToDB(companyName);

    try {
      const dbConfig = await this.connectDBConfig.getDBConfig(companyName);
      const dbName: string = dbConfig.dbName;
      const rows = await this.catalogRepository.getCatalog(dbName, connection);

      return rows;
    } finally {
      connection.release();
    }
  }

  async createDb(dto: CreateDbDto) {}
}
