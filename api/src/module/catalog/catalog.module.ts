import { Logger, Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';
import { FirebaseModule } from '../firebase/firebase.module';
import { RedisService } from '../redis/redis.service';

@Module({
  imports: [FirebaseModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository, ConnectDBConfig, RedisService, Logger],
})
export class CatalogModule {}
