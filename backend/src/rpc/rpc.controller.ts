import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
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
}

