import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseInterface } from '../../common/interface/response.interface';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(): Promise<ResponseInterface> {
    const data = await this.dashboardService.getMainStats();
    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}
