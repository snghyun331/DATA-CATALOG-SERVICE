import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getMainStats() {
    const databases = await this.firebaseService.getAllDatabases();

    // Firestore에 데이터가 없는 경우 빈 결과 반환
    if (databases.length === 0) {
      return {
        totalStats: {
          dbList: [],
          dbCount: 0,
          totalTableCount: 0,
          totalRows: 0,
          latestUpdated: null,
        },
        dbStats: [],
      };
    }

    /* DB Stats */
    const dbStats = databases.map(({ dbName, data }) => ({
      dbName,
      lastUpdated: data.lastUpdated,
      dbSize: data.dbSize || 0,
      tableList: data.tableList || [],
      tableCount: (data.tableList || []).length,
      totalRows: data.totalRows || 0,
      dbTag: data.dbTag || '',
    }));

    /* totalStats */
    const dbList = dbStats.map((stats) => stats.dbName);
    const dbCount = dbList.length;
    const totalTableCount = dbStats.reduce((sum, item) => sum + item.tableCount, 0);
    const totalRows = dbStats.reduce((sum, item) => sum + item.totalRows, 0);

    // 가장 최신 업데이트 시간 (DB가 있는 경우에만)
    let latestUpdated = null;
    if (dbStats.length > 0) {
      latestUpdated = dbStats.reduce((latest, current) => {
        const currentDate = current.lastUpdated instanceof Date ? current.lastUpdated : new Date(current.lastUpdated);
        const latestDate = latest.lastUpdated instanceof Date ? latest.lastUpdated : new Date(latest.lastUpdated);
        return currentDate > latestDate ? current : latest;
      }).lastUpdated;
    }

    const totalStats = { dbList, dbCount, totalTableCount, totalRows, latestUpdated };

    return { totalStats, dbStats };
  }
}
