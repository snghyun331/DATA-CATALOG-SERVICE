import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConnection, createPool } from 'mysql2/promise';
import { ConnectDBConfig } from '../../../config/db.config';

@Injectable()
export class CatalogRepository {
  private poolCache: Map<string, Pool> = new Map();

  constructor(
    public readonly configService: ConfigService,
    private readonly connectDBConfig: ConnectDBConfig,
  ) {}

  /* 커넥션 Pool에서 커넥션 하나 가져오는 함수 */
  async getConnectionToDB(companyCode: string): Promise<PoolConnection> {
    const pool = await this.getPool(companyCode);

    return pool.getConnection();
  }

  /* Pool 생성 또는 캐시 재사용하는 함수 */
  private async getPool(companyCode: string): Promise<Pool> {
    if (!this.poolCache.has(companyCode)) {
      const dbConfig = await this.connectDBConfig.getDBConfig(companyCode);

      const pool = createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.userName,
        password: dbConfig.password,
        database: dbConfig.dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      this.poolCache.set(companyCode, pool);
    }

    return this.poolCache.get(companyCode)!;
  }

  async getTableCatalogInDb(dbName: string, connection: PoolConnection) {
    const query = `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY, COLUMN_COMMENT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = '${dbName}' ORDER BY TABLE_NAME`;

    const [rows] = await connection.query(query);

    return rows;
  }

  async getMasterCatalogInDb(dbName: string, connection: PoolConnection) {
    const query = `SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_ROWS, TABLE_COMMENT, ROUND((DATA_LENGTH / 1024 / 1024),2) as DATA_SIZE
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = '${dbName}' ORDER BY TABLE_NAME`;

    const [rows] = await connection.query(query);

    return rows;
  }

  async getDatabaseDataSize(dbName: string, connection: PoolConnection): Promise<number> {
    const query = `SELECT ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) AS DB_DATA_SIZE
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = '${dbName}'`;

    const [rows] = await connection.query(query);

    return Number(rows[0].DB_DATA_SIZE);
  }
}
