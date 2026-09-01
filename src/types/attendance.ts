export type AttendanceStatus = 'on_duty' | 'on_break' | 'completed';

export interface AttendanceRecord {
  id: string;
  business_id: string;
  branch_id?: string | null;
  user_id: string;
  staff_name: string;
  staff_email?: string | null;
  staff_role?: string | null;
  clock_in_time: string;
  clock_out_time?: string | null;
  total_minutes?: number | null;
  status: AttendanceStatus;
  clock_in_device_info?: string | null;
  clock_out_notes?: string | null;
  break_start_time?: string | null;
  break_minutes?: number | null;
  verified_by?: string | null;
  is_offline?: boolean;
  synced?: boolean;
  created_at: string;
  updated_at: string;
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface ClockInPayload {
  business_id: string;
  branch_id?: string | null;
  user_id: string;
  staff_name: string;
  staff_email?: string | null;
  staff_role?: string | null;
  device_info?: string | null;
  notes?: string | null;
}

export interface ClockOutPayload {
  record_id: string;
  notes?: string | null;
}

export interface BreakActionPayload {
  record_id: string;
  action: 'start' | 'end';
}

export interface AttendanceSummary {
  total_shifts: number;
  active_now: number;
  on_break: number;
  total_hours_today: number;
  average_shift_hours: number;
}
