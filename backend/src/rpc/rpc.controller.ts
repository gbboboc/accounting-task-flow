import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query, HttpException } from '@nestjs/common';
import { RpcService } from './rpc.service';
import { GenerateTasksForCompanyDto } from './dto/generate-tasks.dto';

@Controller('rpc')
export class RpcController {
  constructor(private readonly rpcService: RpcService) {}

  @Post('generate_tasks_for_company')
  @HttpCode(HttpStatus.OK)
  async generateTasksForCompany(@Body() dto: GenerateTasksForCompanyDto) {
    return this.rpcService.generateTasksForCompany(
      dto.company_id,
      dto.start_date,
      dto.months_ahead,
    );
  }

  @Post('update_task_statuses')
  @HttpCode(HttpStatus.OK)
  async updateTaskStatuses() {
    return this.rpcService.updateTaskStatuses();
  }

  // GET /rpc/tasks?company_id=...&status=...&limit=...&offset=...
  @Get('tasks')
  async getTasksByCompany(
    @Query('company_id') companyId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!companyId) {
      throw new HttpException(
        { error: 'company_id is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsedLimit = typeof limit === 'string' ? Number.parseInt(limit, 10) : undefined;
    const parsedOffset = typeof offset === 'string' ? Number.parseInt(offset, 10) : undefined;

    return this.rpcService.getTasksByCompany({
      companyId,
      status,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
    });
  }
}

