import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class DashboardService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async getMainStats() {
    const mainCollection = 'database';
    const snapshot = await this.firebaseService.getCollectonData(mainCollection);

    /* DB Stats */
    const dbStatsPromises = snapshot.docs.map(async (doc) => {
      const tableList = doc.data().tableList;

      return {
        dbName: doc.id,
        lastUpdated: doc.data().lastUpdated.toDate(),
        dbSize: doc.data().dbSize,
        tableList,
        tableCount: tableList.length,
        totalRows: doc.data().totalRows,
        dbTag: doc.data().dbTag,
      };
    });
    const dbStats = await Promise.all(dbStatsPromises);

    /* totalStats */
    const dbList = dbStats.map((stats) => stats.dbName);
    const dbCount = dbList.length;
    const totalTableCount = dbStats.reduce((sum, item) => sum + item.tableCount, 0);
    const totalRows = dbStats.reduce((sum, item) => sum + item.totalRows, 0);
    // 가장 최신 업데이트 시간
    const latestUpdated = dbStats.reduce((latest, current) => {
      return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
    }).lastUpdated;
    const totalStats = { dbList, dbCount, totalTableCount, totalRows, latestUpdated };

    return { totalStats, dbStats };
  }
}
