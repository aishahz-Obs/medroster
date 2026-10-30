// ─── Department Constants ──────────────────────────────────────────────────────

export const DEPARTMENT = "Obstetrics & Gynaecology";
export const APP_NAME = "MedRoster";

// ─── Roster Rules ─────────────────────────────────────────────────────────────

export const MIN_DAILY_HEADCOUNT = 29;
export const DAILY_ONCALL_COUNT  = 8;
export const DAILY_POSTCALL_COUNT = 8;

// On-call window: 5 PM → 2 PM next day
export const ONCALL_START_HOUR = 17; // 5 PM
export const POSTCALL_END_HOUR = 14; // 2 PM

// ─── Leave Rules ──────────────────────────────────────────────────────────────

export const ANNUAL_LEAVE_DAYS = 25;

/** Standard max leave days per month */
export const LEAVE_MAX_PER_MONTH = 2;

/** Max if previous month had 0 leave taken (carryover) */
export const LEAVE_MAX_CARRYOVER = 4;

/** Max when officer attended a course in the same month */
export const LEAVE_MAX_COURSE_MONTH = 2;

/** Minimum months in advance for leave application */
export const LEAVE_MIN_ADVANCE_MONTHS = 2;
/** Maximum months in advance for leave application */
export const LEAVE_MAX_ADVANCE_MONTHS = 3;

/** Max concurrent leave per day of week (ISO day: 1=Mon, 5=Fri) */
export const DAILY_LEAVE_CAPS: Record<number, number> = {
  1: 3, // Monday
  2: 2, // Tuesday
  3: 3, // Wednesday
  4: 2, // Thursday
  5: 4, // Friday
};

// ─── Leave Types ──────────────────────────────────────────────────────────────

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual:      "Annual Leave",
  maternity:   "Maternity Leave",
  study:       "Study Leave",
  emergency:   "Emergency Leave",
  replacement: "Replacement Leave",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  approved:  "Approved",
  rejected:  "Rejected",
  blocked:   "Blocked",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  rejected:  "bg-red-100 text-red-800",
  blocked:   "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

// ─── Shift Labels ─────────────────────────────────────────────────────────────

export const SHIFT_LABELS: Record<string, string> = {
  regular:  "Regular",
  oncall:   "On-Call",
  postcall: "Post-Call",
  leave:    "On Leave",
};

export const SHIFT_COLORS: Record<string, string> = {
  regular:  "bg-brand-100 text-brand-700",
  oncall:   "bg-purple-100 text-purple-800",
  postcall: "bg-orange-100 text-orange-800",
  leave:    "bg-green-100 text-green-800",
};

// ─── Role Labels ──────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin:      "Admin",
  user:       "Medical Officer",
};

// ─── Nav Items ────────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { href: "/roster",         label: "Roster",         icon: "Calendar" },
  { href: "/leave",          label: "My Leave",       icon: "CalendarClock" },
  { href: "/attendance",     label: "Attendance",     icon: "Clock" },
  { href: "/profile",        label: "My Profile",     icon: "User" },
];

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/roster",   label: "Manage Roster",  icon: "LayoutGrid" },
  { href: "/admin/leaves",   label: "Leave Approvals",icon: "CheckSquare" },
  { href: "/admin/officers", label: "Officers",       icon: "Users" },
  { href: "/admin/audit",    label: "Audit Trail",    icon: "ScrollText" },
  { href: "/admin/reports",  label: "Reports",        icon: "BarChart3" },
];
