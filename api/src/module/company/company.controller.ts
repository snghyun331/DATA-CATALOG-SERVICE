import { Controller, Get } from '@nestjs/common';
import { ResponseInterface } from '../../common/interface/response.interface';
import { CompanyService } from './company.service';

@Controller('api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getAllCompanies(): Promise<ResponseInterface> {
    const data = await this.companyService.getAllCompanies();

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}
