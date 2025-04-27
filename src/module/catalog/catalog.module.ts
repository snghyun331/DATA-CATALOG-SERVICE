import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './repository/catalog.repository';
import { ConnectDBConfig } from '../../config/db.config';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository, ConnectDBConfig],
})
export class CatalogModule {}
