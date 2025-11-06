import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RpcService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async generateTasksForCompany(
    companyId: string,
    startDate?: string,
    monthsAhead?: number,
  ) {
    const supabase = this.supabaseService.getClient();

    const params: any = {
      p_company_id: companyId,
    };

    if (startDate) {
      params.p_start_date = startDate;
    }

    if (monthsAhead !== undefined) {
      params.p_months_ahead = monthsAhead;
    }

    const { error } = await supabase.rpc('generate_tasks_for_company', params);

    if (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { status: 'ok' };
  }

  async updateTaskStatuses() {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.rpc('update_task_statuses');

    if (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { status: 'ok' };
  }
}

