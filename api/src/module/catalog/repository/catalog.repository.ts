import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Pool, PoolConnection, createConnection, createPool } from 'mysql2/promise';
import { ConnectDBConfig } from '../../../config/db.config';

/* Connection과 PoolConnection 모두 .query()를 지원하므로 쿼리 실행용 공통 타입 */
type QueryableConnection = Pick<Connection, 'query'>;

@Injectable()
export class CatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);
  private poolCache: Map<string, Pool> = new Map();

  constructor(
    public readonly configService: ConfigService,
    private readonly connectDBConfig: ConnectDBConfig,
  ) {}

  /* 커넥션 Pool에서 커넥션 하나 가져오는 함수 */
  async getConnectionToDB(companyCode: string): Promise<PoolConnection> {
    try {
      const pool = await this.getPool(companyCode);

      return pool.getConnection();
    } catch (error) {
      throw new Error(`Mysql DB 연결이 실패되었습니다 - ${companyCode}: ${error.message}`);
    }
  }

  /* dto로 직접 MySQL 연결하는 함수 (Firestore 조회 없이, 1회용 단일 커넥션) */
  async createDirectConnection(dbInfo: {
    dbHost: string;
    dbPort: number;
    dbUser: string;
    dbPw: string;
    dbName: string;
  }): Promise<Connection> {
    try {
      return await createConnection({
        host: dbInfo.dbHost,
        port: dbInfo.dbPort,
        user: dbInfo.dbUser,
        password: dbInfo.dbPw,
        database: dbInfo.dbName,
      });
    } catch (error) {
      throw new Error(`Mysql DB 연결이 실패되었습니다: ${error.message}`);
    }
  }

  /* Pool 생성 또는 캐시 재사용 (동시 생성 race 방지: Promise 캐시) */
  private poolPromiseCache: Map<string, Promise<Pool>> = new Map();

  private async getPool(companyCode: string): Promise<Pool> {
    if (!this.poolPromiseCache.has(companyCode)) {
      const poolPromise = this.createAndCachePool(companyCode);
      this.poolPromiseCache.set(companyCode, poolPromise);
    }

    return this.poolPromiseCache.get(companyCode)!;
  }

  private async createAndCachePool(companyCode: string): Promise<Pool> {
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
    return pool;
  }

  async getTableCatalogInDb(dbName: string, connection: QueryableConnection) {
    const query = `
      SELECT 
      TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY, COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = '${dbName}' 
      ORDER BY TABLE_NAME`;

    const [rows] = await connection.query(query);

    return rows;
  }

  async getMasterCatalogInDb(dbName: string, connection: QueryableConnection) {
    const query = `
      SELECT 
      TABLE_SCHEMA, TABLE_NAME, TABLE_ROWS, TABLE_COMMENT, ROUND((DATA_LENGTH / 1024 / 1024),2) as DATA_SIZE
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = '${dbName}' 
      ORDER BY TABLE_NAME`;

    const [rows] = await connection.query(query);

    return rows;
  }

  async getDatabaseDataSize(dbName: string, connection: QueryableConnection): Promise<number> {
    const query = `
      SELECT 
      ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 2) AS DB_DATA_SIZE
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = '${dbName}'`;

    const [rows] = await connection.query(query);

    return Number(rows[0].DB_DATA_SIZE);
  }

  async getForeignKeyRelations(dbName: string, connection: QueryableConnection) {
    const query = `
      SELECT 
      TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbName}' AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `;

    const [rows] = await connection.query(query);

    return rows;
  }

  async getPrimaryKeys(dbName: string, connection: QueryableConnection) {
    const query = `
      SELECT 
      TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbName}' AND CONSTRAINT_NAME = 'PRIMARY'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;

    const [rows] = await connection.query(query);

    return rows;
  }
}
