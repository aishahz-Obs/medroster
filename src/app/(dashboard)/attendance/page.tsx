import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, isToday } from "date-fns";
import { ClockInButton } from "./clock-in-button";
import { Clock, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  // Today's clock-in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: todayRaw } = await (supabase.from("clock_ins") as any)
    .select("*")
    .eq("officer_id", user.id)
    .eq("work_date", today)
    .maybeSingle();
  const todayClockIn = todayRaw as import("@/lib/types").ClockIn | null;

  // Recent history (last 14 days)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: historyRaw } = await (supabase.from("clock_ins") as any)
    .select("*")
    .eq("officer_id", user.id)
    .order("work_date", { ascending: false })
    .limit(14);
  const history = historyRaw as import("@/lib/types").ClockIn[] | null;

  const hasClockedIn = !!todayClockIn?.clocked_in_at;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
      </div>

      {/* Today's status card */}
      <div className={`rounded-2xl border shadow-sm p-6 mb-6 ${
        hasClockedIn
          ? "bg-teal-50 border-teal-200"
          : "bg-white border-gray-200"
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
          </div>
        )}

        {!hasClockedIn && (
          <ClockInButton userId={user.id} workDate={today} />
        )}
      </div>

      {/* Recent history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Attendance</h2>
        </div>
        {(!history || history.length === 0) ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No attendance records yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map(entry => {
              const isPresent = !!entry.clocked_in_at;
              const isMia     = entry.status === "mia";
              const isEl      = entry.status === "el";
              let notesData: Record<string, string> = {};
              try { notesData = JSON.parse(entry.notes ?? "{}"); } catch { /* ignore */ }
              const workTypeLabel: Record<string, string> = {
                office_hour: "Office Hour",
                oncall:      "On-Call",
                postcall:    "Post-Call",
                course:      "Course",
              };
              const workLabel = workTypeLabel[notesData.work_type] ?? "";
              return (
                <li key={entry.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(entry.work_date + "T00:00:00"), "EEE, d MMM yyyy")}
                      {isToday(new Date(entry.work_date + "T00:00:00")) && (
                        <span className="ml-2 text-xs text-brand-600 font-semibold">Today</span>
                      )}
                    </p>
                    {isPresent && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {format(new Date(entry.clocked_in_at!), "h:mm a")}
                        {entry.location_name && ` · ${entry.location_name}`}
                        {workLabel && ` · ${workLabel}`}
                      </p>
                    )}
                    {notesData.work_type === "course" && notesData.course_name && (
                      <p className="text-xs text-blue-600 mt-0.5">{notesData.course_name} — {notesData.course_location}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isMia ? "bg-red-100 text-red-700" :
                    isEl  ? "bg-yellow-100 text-yellow-700" :
                    isPresent ? "bg-teal-100 text-teal-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {isMia ? "MIA" : isEl ? "EL" : isPresent ? "Present" : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
