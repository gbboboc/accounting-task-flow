import { IsUUID, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateTasksForCompanyDto {
  @IsUUID()
  company_id: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  months_ahead?: number;
}

