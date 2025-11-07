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

    let validatedLimit: number | undefined;
    let validatedOffset: number | undefined;

    if (limit) {
      const parsedLimit = Number.parseInt(limit, 10);
      const parsedAsFloat = Number.parseFloat(limit);
      if (
        !Number.isFinite(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit !== parsedAsFloat
      ) {
        throw new HttpException(
          { error: 'limit must be a positive integer' },
          HttpStatus.BAD_REQUEST,
        );
      }
      validatedLimit = parsedLimit;
    }

    if (offset) {
      const parsedOffset = Number.parseInt(offset, 10);
      const parsedAsFloat = Number.parseFloat(offset);
      if (
        !Number.isFinite(parsedOffset) ||
        parsedOffset < 0 ||
        parsedOffset !== parsedAsFloat
      ) {
        throw new HttpException(
          { error: 'offset must be a non-negative integer' },
          HttpStatus.BAD_REQUEST,
        );
      }
      validatedOffset = parsedOffset;
    }

    return this.rpcService.getTasksByCompany({
      companyId,
      status,
      limit: validatedLimit,
      offset: validatedOffset,
    });
  }
}

