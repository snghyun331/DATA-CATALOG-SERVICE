// src/user/user.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ResponseInterface } from '../../common/interface/response.interface';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':company')
  async getUsers(@Param('company') company: string): Promise<ResponseInterface> {
    const data = await this.catalogService.findAll(company);

    const response = { message: 'success', data };

    return response;
  }
}
