import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateDbDto } from './dto/createDb.dto';
import { updateEnvFile } from '../../common/utils/utility';

@Injectable()
export class CatalogService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly catalogRepository: CatalogRepository,
    private readonly connectDBConfig: ConnectDBConfig,
    // private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(companyName: string) {
    const connection = await this.catalogRepository.getConnectionToDB(companyName);

    try {
      const dbConfig = await this.connectDBConfig.getDBConfig(companyName);
      const dbName: string = dbConfig.dbName;
      const rows = await this.catalogRepository.getTableCatalog(dbName, connection);

      return rows;
    } finally {
      connection.release();
    }
  }

  async createDbAndCatalog(dto: CreateDbDto): Promise<void> {
    const { company, ...dbInfo } = dto;

    /* 이미 같은 DB를 저장했다면 예외처리 */
    // firebase

    /* 입력받은 정보를 .env에 저장 */
    const envFormatted = {
      [`DB_${company}_HOST`]: dbInfo.dbHost,
      [`DB_${company}_PORT`]: dbInfo.dbPort,
      [`DB_${company}_USER`]: dbInfo.dbUser,
      [`DB_${company}_NAME`]: dbInfo.dbName,
      [`DB_${company}_PW`]: dbInfo.dbPw,
    };
    updateEnvFile(envFormatted);

    /* DB로부터 Catalog 정보 불러오기 & 모두 firebase에 저장 */
    const connection = await this.catalogRepository.getConnectionToDB(company);
    try {
      // catalog 정보 불러오기
      const tableRows = await this.catalogRepository.getTableCatalog(dbInfo.dbName, connection);
      const masterRows = await this.catalogRepository.getMasterCatalog(dbInfo.dbName, connection);

      // firebase에 저장

      // 캐싱
    } catch (err) {
      this.logger.error(err);
    } finally {
      connection.release();
    }
  }
}
