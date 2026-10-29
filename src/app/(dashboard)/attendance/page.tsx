import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isToday } from "date-fns";
import { ClockInButton } from "./clock-in-button";
import { EditAttendanceModal } from "./edit-attendance-modal";
import { Clock, CheckCircle2, AlertTriangle, MapPin, Users } from "lucide-react";
import type { ClockIn } from "@/lib/types";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meRaw } = await (supabase.from("profiles") as any)
    .select("role, full_name").eq("id", user.id).single();
  const me = meRaw as { role: string; full_name: string } | null;
  const isAdmin = me?.role === "superadmin" || me?.role === "admin";

  // Today's clock-in for this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: todayRaw } = await (supabase.from("clock_ins") as any)
    .select("*")
    .eq("officer_id", user.id)
    .eq("attendance_date", today)
    .maybeSingle();
  const todayClockIn = todayRaw as ClockIn | null;
  const hasClockedIn = !!todayClockIn?.clocked_in_at;

  // Personal recent history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRaw } = await (supabase.from("clock_ins") as any)
    .select("*")
    .eq("officer_id", user.id)
    .order("attendance_date", { ascending: false })
    .limit(14);
  const history = historyRaw as ClockIn[] | null;

  // Admin: all department attendance today
  let allTodayRaw: (ClockIn & { officer: { full_name: string } | null })[] | null = null;
  if (isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("clock_ins") as any)
      .select("*, officer:profiles!clock_ins_officer_id_fkey(full_name)")
      .eq("attendance_date", today)
      .order("clocked_in_at", { ascending: true });
    allTodayRaw = data;
  }

  function parseNotes(notes: string | null) {
    try { return JSON.parse(notes ?? "{}") as Record<string, string>; }
    catch { return {} as Record<string, string>; }
  }

  const workTypeLabel: Record<string, string> = {
    office_hour: "Office Hour",
    oncall:      "On-Call",
    postcall:    "Post-Call",
    course:      "Course",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
      </div>

      {/* Today's status card */}
      <div className={`rounded-2xl border shadow-sm p-6 mb-6 ${
        hasClockedIn ? "bg-teal-50 border-teal-200" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {hasClockedIn ? (
            <CheckCircle2 className="text-teal-600" size={28} />
          ) : (
            <AlertTriangle className="text-amber-500" size={28} />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-600">Today</p>
            <p className={`text-xl font-bold ${hasClockedIn ? "text-teal-700" : "text-amber-700"}`}>
              {hasClockedIn ? "Clocked In" : "Not Yet Clocked In"}
            </p>
          </div>
        </div>

        {hasClockedIn && todayClockIn && (
          <div className="flex flex-col gap-1.5 text-sm text-teal-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{format(new Date(todayClockIn.clocked_in_at!), "h:mm a")}</span>
            </div>
            {todayClockIn.location_name && (
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{todayClockIn.location_name}</span>
              </div>
            )}
            {(() => {
              const n = parseNotes(todayClockIn.notes);
              return n.work_type ? (
                <p className="text-xs text-teal-700 mt-0.5">
                  {workTypeLabel[n.work_type] ?? n.work_type}
                  {n.oncall_location ? ` · On-call at ${n.oncall_location}` : ""}
                  {n.course_name    ? ` · ${n.course_name}` : ""}
                </p>
              ) : null;
            })()}
          </div>
        )}

        {!hasClockedIn && (
          <ClockInButton userId={user.id} workDate={today} />
        )}
      </div>

      {/* Superadmin: all dept attendance today */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">
              Department Attendance Today ({allTodayRaw?.length ?? 0} clocked in)
            </h2>
          </div>
          {(!allTodayRaw || allTodayRaw.length === 0) ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No one has clocked in yet today.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {allTodayRaw.map(entry => {
                const n = parseNotes(entry.notes);
                return (
                  <li key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.officer?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {entry.clocked_in_at && (
                          <><Clock size={11} />{format(new Date(entry.clocked_in_at), "h:mm a")}</>
                        )}
                        {entry.location_name && ` · ${entry.location_name}`}
                        {n.work_type && ` · ${workTypeLabel[n.work_type] ?? n.work_type}`}
                        {n.oncall_location && ` (${n.oncall_location})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        entry.status === "present" ? "bg-teal-100 text-teal-700" :
                        entry.status === "mia"     ? "bg-red-100 text-red-700" :
                        entry.status === "el"      ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {entry.status === "present" ? "Present" :
                         entry.status === "mia"     ? "MIA" :
                         entry.status === "el"      ? "EL" :
                         entry.status}
                      </span>
                      <EditAttendanceModal
                        record={{
                          id:              entry.id,
                          attendance_date: entry.attendance_date,
                          clocked_in_at:   entry.clocked_in_at,
                          location_name:   entry.location_name,
                          status:          entry.status,
                          notes:           entry.notes,
                          officer_name:    entry.officer?.full_name,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Personal recent history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">My Recent Attendance</h2>
        </div>
        {(!history || history.length === 0) ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No attendance records yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map(entry => {
              const isPresent = !!entry.clocked_in_at;
              const isMia     = entry.status === "mia";
              const isEl      = entry.status === "el";
              const n         = parseNotes(entry.notes);
              return (
                <li key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(entry.attendance_date + "T00:00:00"), "EEE, d MMM yyyy")}
                      {isToday(new Date(entry.attendance_date + "T00:00:00")) && (
                        <span className="ml-2 text-xs text-brand-600 font-semibold">Today</span>
                      )}
                    </p>
                    {isPresent && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {format(new Date(entry.clocked_in_at!), "h:mm a")}
                        {entry.location_name && ` · ${entry.location_name}`}
                        {n.work_type && ` · ${workTypeLabel[n.work_type] ?? n.work_type}`}
                      </p>
                    )}
                    {n.work_type === "course" && n.course_name && (
                      <p className="text-xs text-blue-600 mt-0.5">{n.course_name} — {n.course_location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      isMia ? "bg-red-100 text-red-700" :
                      isEl  ? "bg-yellow-100 text-yellow-700" :
                      isPresent ? "bg-teal-100 text-teal-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {isMia ? "MIA" : isEl ? "EL" : isPresent ? "Present" : "—"}
                    </span>
                    {isAdmin && (
                      <EditAttendanceModal
                        record={{
                          id:              entry.id,
                          attendance_date: entry.attendance_date,
                          clocked_in_at:   entry.clocked_in_at,
                          location_name:   entry.location_name,
                          status:          entry.status,
                          notes:           entry.notes,
                        }}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
