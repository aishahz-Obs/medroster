// ─── Database Types ────────────────────────────────────────────────────────────
// Auto-generate this file by running: npx supabase gen types typescript --linked > src/lib/types.ts
// For now, these are the manual types matching the schema.

export type UserRole = "superadmin" | "admin" | "user";
export type ShiftType = "regular" | "oncall" | "postcall";
export type LeaveType = "annual" | "maternity" | "study" | "emergency" | "replacement";
export type LeaveStatus = "pending" | "approved" | "rejected" | "blocked" | "cancelled";
export type AttendanceStatus = "present" | "mia" | "el" | "leave";

export interface Profile {
  id: string;
  full_name: string;
  staff_id: string;
  email: string;
  role: UserRole;
  department: string;
  join_date: string | null;
  is_active: boolean;
  annual_leave_days: number;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  min_staff: number;
  max_staff: number;
  active_days: number[] | null;
  requires_senior: boolean;
  requires_tagger: boolean;
  notes: string | null;
  display_order: number;
}

export interface RosterEntry {
  id: string;
  entry_date: string;
  officer_id: string;
  location_id: number | null;
  shift: ShiftType;
  oncall_start: string | null;
  oncall_end: string | null;
  is_tagger: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  officer?: Profile;
  location?: Location;
}

export interface ClockIn {
  id: string;
  officer_id: string;
  attendance_date: string;
  clocked_in_at: string | null;
  location_id: number | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  // Joined
  officer?: Profile;
  location?: Location;
}

export interface LeaveRequest {
  id: string;
  officer_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  evidence_path: string | null;
  status: LeaveStatus;
  block_reason: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  is_override: boolean;
  override_by: string | null;
  override_reason: string | null;
  created_at: string;
  // Joined
  officer?: Profile;
  reviewer?: Profile;
}

export interface LeaveBalance {
  id: string;
  officer_id: string;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
}

export interface Course {
  id: string;
  officer_id: string;
  course_name: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined
  actor?: Profile;
}

// Placeholder Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      locations: { Row: Location; Insert: Partial<Location>; Update: Partial<Location> };
      roster_entries: { Row: RosterEntry; Insert: Partial<RosterEntry>; Update: Partial<RosterEntry> };
      clock_ins: { Row: ClockIn; Insert: Partial<ClockIn>; Update: Partial<ClockIn> };
      leave_requests: { Row: LeaveRequest; Insert: Partial<LeaveRequest>; Update: Partial<LeaveRequest> };
      leave_balances: { Row: LeaveBalance; Insert: Partial<LeaveBalance>; Update: Partial<LeaveBalance> };
      courses: { Row: Course; Insert: Partial<Course>; Update: Partial<Course> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      shift_type: ShiftType;
      leave_type: LeaveType;
      leave_status: LeaveStatus;
      attendance_status: AttendanceStatus;
    };
  };
};
