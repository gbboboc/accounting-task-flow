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

  async getTasksByCompany(params: {
    companyId: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('tasks')
      .select('id, title, description, status, due_date, completed_at, template_id, depends_on_tasks', { count: 'exact' })
      .eq('company_id', params.companyId)
      .order('due_date', { ascending: true });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (typeof params.offset === 'number') {
      const from = params.offset;
      const to = params.limit ? params.offset + params.limit - 1 : params.offset + 49;
      query = query.range(from, to);
    } else if (typeof params.limit === 'number') {
      query = query.limit(params.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new HttpException(
        { error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { count, data };
  }
}

