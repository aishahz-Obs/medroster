"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  // Upsert roster entry (one per officer per day)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("roster_entries") as any).upsert(
    { officer_id: user.id, entry_date: data.date, shift, location_id: loc?.id ?? null },
    { onConflict: "entry_date,officer_id" }
  );

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
