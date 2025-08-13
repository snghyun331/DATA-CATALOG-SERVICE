import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getMainStats() {
    const mainCollection = 'database';
    const snapshot = await this.firebaseService.getCollectonData(mainCollection);

    // Firestore에 데이터가 없는 경우 빈 결과 반환
    if (snapshot.empty || snapshot.docs.length === 0) {
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
    const dbStatsPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const tableList = data.tableList || [];

      return {
        dbName: doc.id,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        dbSize: data.dbSize || 0,
        tableList,
        tableCount: tableList.length,
        totalRows: data.totalRows || 0,
        dbTag: data.dbTag || '',
      };
    });
    const dbStats = await Promise.all(dbStatsPromises);

    /* totalStats */
    const dbList = dbStats.map((stats) => stats.dbName);
    const dbCount = dbList.length;
    const totalTableCount = dbStats.reduce((sum, item) => sum + item.tableCount, 0);
    const totalRows = dbStats.reduce((sum, item) => sum + item.totalRows, 0);
    
    // 가장 최신 업데이트 시간 (DB가 있는 경우에만)
    let latestUpdated = null;
    if (dbStats.length > 0) {
      latestUpdated = dbStats.reduce((latest, current) => {
        return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
      }).lastUpdated;
    }
    
    const totalStats = { dbList, dbCount, totalTableCount, totalRows, latestUpdated };

    return { totalStats, dbStats };
  }
}
