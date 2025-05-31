import { Controller, Get, Post, Param, Body, Put, Patch } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ResponseInterface } from '../../common/interface/response.interface';
import { CreateDbDto } from './dto/createDb.dto';
import { UpdateColumnNoteDto } from './dto/updateColumnNote.dto';
import { UpdateTableDescription } from './dto/updateTableDescription.dto';

@Controller('api/v1/databases')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('db')
  async createDb(@Body() dto: CreateDbDto): Promise<ResponseInterface> {
    await this.catalogService.createDbAndCatalog(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @Get('db')
  async getDbList(): Promise<ResponseInterface> {
    const data = await this.catalogService.getDbList();

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @Get(':companyCode/master')
  async getMasterCatalog(@Param('companyCode') companyCode: string): Promise<ResponseInterface> {
    const data = await this.catalogService.getMasterCatalog(companyCode);

    const response = { message: 'success', data };

    return response;
  }

  @Get(':companyCode/tables/:tableName')
  async getTableCatalog(
    @Param('companyCode') companyCode: string,
    @Param('tableName') tableName: string,
  ): Promise<ResponseInterface> {
    const data = await this.catalogService.getTableCatalog(companyCode, tableName);

    const response = { message: 'success', data };

    return response;
  }

  @Get(':companyCode/diff')
  async detectChanges(@Param('companyCode') companyCode: string): Promise<ResponseInterface> {
    const data = await this.catalogService.detectChanges(companyCode);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @Put(':companyCode')
  async updateCatalog(@Param('companyCode') companyCode: string): Promise<ResponseInterface> {
    await this.catalogService.updateCatalog(companyCode);

    const response: ResponseInterface = { message: 'succeses' };

    return response;
  }

  @Patch(':companyCode/tables/:tableName/:columnName')
  async updateColumnNote(
    @Param('companyCode') companyCode: string,
    @Param('tableName') tableName: string,
    @Param('columnName') columnName: string,
    @Body() { note }: UpdateColumnNoteDto,
  ): Promise<ResponseInterface> {
    await this.catalogService.updateColumnNote(companyCode, tableName, columnName, note);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @Patch(':companyCode/master/:tableName')
  async updateTableDescription(
    @Param('companyCode') companyCode: string,
    @Param('tableName') tableName: string,
    @Body() { description }: UpdateTableDescription,
  ): Promise<ResponseInterface> {
    await this.catalogService.updateTableDescription(companyCode, tableName, description);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
