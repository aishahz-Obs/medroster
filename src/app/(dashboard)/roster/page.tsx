import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, isToday, parseISO } from "date-fns";
import { SHIFT_LABELS, SHIFT_COLORS } from "@/lib/constants";
import { WeekNav } from "./week-nav";
import type { RosterEntry, LeaveRequest } from "@/lib/types";

export const metadata = { title: "Roster" };

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase  = await createClient();
  const params    = await searchParams;

  // Determine week start (Monday). Use ?week= param or default to current week.
  const baseDate  = params.week ? parseISO(params.week) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });

  // Mon → Sun (7 days)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const startDate = format(weekDays[0], "yyyy-MM-dd");
  const endDate   = format(weekDays[6], "yyyy-MM-dd");

  const [{ data: entriesRaw }, { data: locationsRaw }, { data: leavesRaw }, { data: clockInsRaw }] =
    await Promise.all([
      // Roster entries (regular/oncall/postcall/leave)
      (supabase as any)
        .from("roster_entries")
        .select("*, officer:profiles!roster_entries_officer_id_fkey(full_name, staff_id, role), location:locations!roster_entries_location_id_fkey(name, code)")
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date")
        .order("shift"),

      // Locations for row headers
      (supabase as any)
        .from("locations")
        .select("*")
        .order("display_order"),

      // Approved/pending leaves overlapping this week
      (supabase as any)
        .from("leave_requests")
        .select("*, officer:profiles!leave_requests_officer_id_fkey(full_name)")
        .lte("start_date", endDate)
        .gte("end_date", startDate)
        .in("status", ["approved", "pending"]),

      // Course clock-ins this week (notes.work_type === 'course')
      (supabase as any)
        .from("clock_ins")
        .select("*, officer:profiles!clock_ins_officer_id_fkey(full_name)")
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate),
    ]);

  const entries   = (entriesRaw  as (RosterEntry & { officer: { full_name: string } | null; location: { name: string } | null })[]) ?? [];
  const locations = (locationsRaw as { id: number; name: string; code: string; min_staff: number; max_staff: number; display_order: number }[]) ?? [];
  const leaves    = (leavesRaw   as (LeaveRequest & { officer: { full_name: string } | null })[]) ?? [];

  type ClockInRow = { id: string; attendance_date: string; notes: string | null; officer: { full_name: string } | null };
  const clockIns  = (clockInsRaw as ClockInRow[]) ?? [];

  // Group roster entries: byDate[dateStr][locationName] = entries[]
  const byDate: Record<string, Record<string, typeof entries>> = {};
  entries.forEach(e => {
    const d   = e.entry_date;
    const loc = e.shift === "leave" ? "__leave__" : (e.location?.name ?? "Unassigned");
    if (!byDate[d]) byDate[d] = {};
    if (!byDate[d][loc]) byDate[d][loc] = [];
    byDate[d][loc].push(e);
  });

  // Build leaves-by-date: day → officers on leave
  const leavesByDate: Record<string, string[]> = {};
  weekDays.forEach(day => {
    const ds = format(day, "yyyy-MM-dd");
    leavesByDate[ds] = leaves
      .filter(l => l.start_date <= ds && l.end_date >= ds)
      .map(l => l.officer?.full_name ?? "?");
  });

  // Build courses-by-date: day → officers on course
  const coursesByDate: Record<string, string[]> = {};
  weekDays.forEach(day => {
    const ds = format(day, "yyyy-MM-dd");
    coursesByDate[ds] = clockIns
      .filter(c => {
        if (c.attendance_date !== ds) return false;
        try { return JSON.parse(c.notes ?? "{}").work_type === "course"; }
        catch { return false; }
      })
      .map(c => c.officer?.full_name ?? "?");
  });

  // Stats for today
  const todayStr      = format(new Date(), "yyyy-MM-dd");
  const todayAll      = entries.filter(e => e.entry_date === todayStr && e.shift !== "leave");
  const oncallCount   = todayAll.filter(e => e.shift === "oncall").length;
  const postcallCount = todayAll.filter(e => e.shift === "postcall").length;
  const presentCount  = todayAll.filter(e => e.shift === "regular").length;
  const leaveCount    = leavesByDate[todayStr]?.length ?? 0;

  const shortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const prefix = parts[0]?.toUpperCase().replace(".", "");
    // Skip "DR" title, return the next word as first name
    return prefix === "DR" ? (parts[1] ?? name) : (parts[0] ?? name);
  };

  return (
    <div className="max-w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-sm text-gray-500">
            {format(weekDays[0], "d MMM")} – {format(weekDays[6], "d MMM yyyy")}
            <span className="ml-2 text-xs text-gray-400">
              ({format(weekDays[0], "MMMM yyyy")})
            </span>
          </p>
        </div>
        <WeekNav weekStart={weekStart} />
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-6xl mx-auto">
        {[
          { label: "Regular today",   val: presentCount,  color: "bg-brand-50 text-brand-700" },
          { label: "On-call tonight", val: oncallCount,   color: "bg-purple-50 text-purple-700" },
          { label: "Post-call today", val: postcallCount, color: "bg-orange-50 text-orange-700" },
          { label: "On leave today",  val: leaveCount,    color: "bg-green-50 text-green-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-bold font-mono">{s.val}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Roster table — scrolls horizontally */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 sticky left-0 bg-white z-10">
                Location
              </th>
              {weekDays.map(day => (
                <th key={day.toString()}
                  className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[90px]
                    ${isToday(day) ? "bg-brand-50 text-brand-700" : "text-gray-500"}
                    ${day.getDay() === 0 || day.getDay() === 6 ? "bg-gray-50/80" : ""}`}
                >
                  {format(day, "EEE")}
                  <span className={`block text-base font-bold mt-0.5 ${isToday(day) ? "text-brand-600" : "text-gray-800"}`}>
                    {format(day, "d")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Location rows */}
            {locations.map(loc => (
              <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700 text-xs leading-snug sticky left-0 bg-white">
                  {loc.name}
                  <span className="block text-gray-400 font-normal text-[10px]">
                    min {loc.min_staff}{loc.max_staff !== loc.min_staff ? `–${loc.max_staff}` : ""}
                  </span>
                </td>
                {weekDays.map(day => {
                  const ds         = format(day, "yyyy-MM-dd");
                  const cell       = byDate[ds]?.[loc.name] ?? [];
                  const isWeekend  = day.getDay() === 0 || day.getDay() === 6;
                  const understaff = !isWeekend && cell.length < loc.min_staff;
                  return (
                    <td key={ds} className={`px-1 py-1.5 align-top text-center
                      ${isToday(day) ? "bg-brand-50/30" : ""}
                      ${isWeekend ? "bg-gray-50/60" : ""}
                      ${understaff && cell.length > 0 ? "bg-red-50/40" : ""}`}
                    >
                      {cell.length === 0 ? (
                        <span className="text-gray-200 text-xs">—</span>
                      ) : (
                        <div className="flex flex-col gap-0.5 items-center">
                          {cell.map(entry => (
                            <span key={entry.id}
                              title={`${entry.officer?.full_name ?? "?"} — ${SHIFT_LABELS[entry.shift] ?? entry.shift}`}
                              className={`inline-block px-1 py-0.5 rounded text-[10px] font-semibold truncate max-w-[76px] ${SHIFT_COLORS[entry.shift] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {shortName(entry.officer?.full_name ?? "?")}
                            </span>
                          ))}
                          {understaff && (
                            <span className="text-[9px] text-red-500 font-semibold">⚠ {cell.length}/{loc.min_staff}</span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Unassigned row (entries with no location match) */}
            {weekDays.some(d => (byDate[format(d, "yyyy-MM-dd")]?.["Unassigned"] ?? []).length > 0) && (
              <tr className="border-b border-gray-100 bg-amber-50/30">
                <td className="px-3 py-2 text-xs font-medium text-amber-600 sticky left-0 bg-amber-50/30">
                  Unassigned
                </td>
                {weekDays.map(day => {
                  const ds   = format(day, "yyyy-MM-dd");
                  const cell = byDate[ds]?.["Unassigned"] ?? [];
                  return (
                    <td key={ds} className={`px-1 py-1.5 align-top text-center ${isToday(day) ? "bg-brand-50/20" : ""}`}>
                      {cell.length === 0 ? <span className="text-gray-200 text-xs">—</span> : (
                        <div className="flex flex-col gap-0.5 items-center">
                          {cell.map(e => (
                            <span key={e.id}
                              className={`inline-block px-1 py-0.5 rounded text-[10px] font-semibold truncate max-w-[76px] ${SHIFT_COLORS[e.shift] ?? "bg-gray-100 text-gray-600"}`}>
                              {shortName(e.officer?.full_name ?? "?")}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Leaves row */}
            <tr className="border-b border-green-100 bg-green-50/40">
              <td className="px-3 py-2 text-xs font-semibold text-green-700 sticky left-0 bg-green-50/40">
                Leaves
              </td>
              {weekDays.map(day => {
                const ds    = format(day, "yyyy-MM-dd");
                const names = leavesByDate[ds] ?? [];
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <td key={ds} className={`px-1 py-1.5 align-top text-center ${isWeekend ? "bg-gray-50/60" : ""} ${isToday(day) ? "bg-brand-50/20" : ""}`}>
                    {names.length === 0 ? <span className="text-gray-200 text-xs">—</span> : (
                      <div className="flex flex-col gap-0.5 items-center">
                        {names.map((n, i) => (
                          <span key={i} className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold truncate max-w-[76px] bg-green-100 text-green-800">
                            {shortName(n)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Courses row */}
            <tr className="border-b border-blue-100 bg-blue-50/40">
              <td className="px-3 py-2 text-xs font-semibold text-blue-700 sticky left-0 bg-blue-50/40">
                Courses
              </td>
              {weekDays.map(day => {
                const ds    = format(day, "yyyy-MM-dd");
                const names = coursesByDate[ds] ?? [];
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <td key={ds} className={`px-1 py-1.5 align-top text-center ${isWeekend ? "bg-gray-50/60" : ""} ${isToday(day) ? "bg-brand-50/20" : ""}`}>
                    {names.length === 0 ? <span className="text-gray-200 text-xs">—</span> : (
                      <div className="flex flex-col gap-0.5 items-center">
                        {names.map((n, i) => (
                          <span key={i} className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold truncate max-w-[76px] bg-blue-100 text-blue-800">
                            {shortName(n)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap max-w-6xl mx-auto">
        {Object.entries(SHIFT_LABELS).map(([key, label]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${SHIFT_COLORS[key]}`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-red-50 text-red-600">
          <span>⚠</span> Understaffed
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-gray-50 text-gray-500">
          Sat/Sun shaded
        </span>
      </div>
    </div>
  );
}
