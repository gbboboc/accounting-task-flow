export type OrganizationType = "SRL" | "ÎI" | "ÎP" | "ONG"
export type TvaType = "lunar" | "trimestrial"
export type TaxRegime = "general" | "simplified" | "agricultural"
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue"
export type TaskFrequency = "monthly" | "quarterly" | "annual" | "weekly"

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  fiscal_code: string
  location: string
  contact_person?: string
  phone?: string
  email?: string
  organization_type: OrganizationType
  is_tva_payer: boolean
  tva_type?: TvaType
  has_employees: boolean
  employee_count: number
  tax_regime: TaxRegime
  accounting_start_date: string
  status: "active" | "inactive" | "archived"
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  company_id: string
  template_id?: string
  title: string
  description?: string
  due_date: string
  status: TaskStatus
  completed_at?: string
  completed_by?: string
  notes?: string
  depends_on?: string
  created_at: string
  updated_at: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  frequency: TaskFrequency
  deadline_day: number
  deadline_month?: number
  applies_to_tva_payers: boolean
  applies_to_employers: boolean
  applies_to_org_types?: OrganizationType[]
  reminder_days: number[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  company_id?: string
  task_id?: string
  action: string
  description: string
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_daily_summary: boolean
  email_task_reminder_7days: boolean
  email_task_reminder_3days: boolean
  email_task_reminder_1day: boolean
  email_task_reminder_due: boolean
  email_overdue_tasks: boolean
  push_task_completed: boolean
  push_company_added: boolean
  push_system_updates: boolean
  created_at: string
  updated_at: string
}

export interface TaskTemplateOverride {
  id: string
  company_id: string
  template_id: string
  is_disabled: boolean
  notes?: string
  custom_deadline_day?: number | null
  custom_deadline_month?: number | null
  created_at: string
  updated_at: string
}
