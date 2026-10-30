"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

export async function recordAttendance(data: {
  date:            string;
  time:            string;
  location:        string;
  workStatus:      string;
  oncallLocation?: string;
  courseName?:     string;
  courseLocation?: string;
  courseTime?:     string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clockedInAt = new Date(`${data.date}T${data.time}:00`).toISOString();

  const notesData: Record<string, string> = { work_type: data.workStatus };
  if (data.workStatus === "oncall" && data.oncallLocation) {
    notesData.oncall_location = data.oncallLocation;
  }
  if (data.workStatus === "course") {
    notesData.course_name     = data.courseName     ?? "";
    notesData.course_location = data.courseLocation ?? "";
    notesData.course_time     = data.courseTime     ?? "";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: clockInError } = await (supabase.from("clock_ins") as any).insert({
    officer_id:      user.id,
    attendance_date: data.date,
    clocked_in_at:   clockedInAt,
    location_name:   data.location,
    status:          "present",
    notes:           JSON.stringify(notesData),
  });

  if (clockInError) return { error: clockInError.message };

  // Map work status → roster shift
  const shiftMap: Record<string, string> = {
    office_hour: "regular",
    oncall:      "oncall",
    postcall:    "postcall",
    course:      "regular",
  };
  const shift = shiftMap[data.workStatus] ?? "regular";

  // Find matching location id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loc } = await (supabase.from("locations") as any)
    .select("id")
    .ilike("name", `%${data.location}%`)
    .limit(1)
    .maybeSingle();

  // Upsert roster entry using service role to bypass RLS
  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("roster_entries") as any).upsert(
    { officer_id: user.id, entry_date: data.date, shift, location_id: loc?.id ?? null },
    { onConflict: "entry_date,officer_id" }
  );

  revalidatePath("/attendance");
  revalidatePath("/roster");
  revalidatePath("/admin/roster");

  return { error: null };
}

const LEAVE_TYPE_MAP: Record<string, string> = {
  annual_leave:     "annual",
  emergency_leave:  "emergency",
  maternal_leave:   "maternity",
  study_leave:      "study",
  unrecorded_leave: "replacement",
};

export async function recordLeave(data: {
  leaveType:  string;
  startDate:  string;
  endDate:    string;
  reason?:    string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dbLeaveType = LEAVE_TYPE_MAP[data.leaveType] ?? "annual";

  // Count working days
  const start = new Date(data.startDate);
  const end   = new Date(data.endDate);
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: leaveErr } = await (supabase.from("leave_requests") as any).insert({
    officer_id:   user.id,
    leave_type:   dbLeaveType,
    start_date:   data.startDate,
    end_date:     data.endDate,
    days_count:   days,
    reason:       data.reason ?? null,
    status:       "pending",
  });
  if (leaveErr) return { error: leaveErr.message };

  // Add roster entries for each day of the leave range
  const entries = [];
  const d = new Date(start);
  while (d <= end) {
    entries.push({
      officer_id:  user.id,
      entry_date:  d.toISOString().slice(0, 10),
      shift:       "leave" as const,
      location_id: null,
    });
    d.setDate(d.getDate() + 1);
  }

  if (entries.length > 0) {
    // Use service role to bypass RLS
    const admin = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("roster_entries") as any).upsert(entries, {
      onConflict: "entry_date,officer_id",
    });
  }

  revalidatePath("/attendance");
  revalidatePath("/roster");
  revalidatePath("/admin/roster");
  return { error: null };
}

export async function clearAllAttendanceData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  if (!me || me.role !== "superadmin") return { error: "Forbidden" };

  const admin = getAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("roster_entries") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("clock_ins") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("leave_requests") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  revalidatePath("/attendance");
  revalidatePath("/roster");
  revalidatePath("/admin/roster");
  return { error: null };
}

export async function editAttendance(recordId: string, data: {
  attendance_date: string;
  clocked_in_at:   string;
  location_name:   string;
  status:          string;
  notes?:          string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only superadmin/admin may edit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  if (!me || me.role === "user") return { error: "Forbidden" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("clock_ins") as any)
    .update(data)
    .eq("id", recordId);

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { error: null };
}
