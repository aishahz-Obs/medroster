import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { SHIFT_LABELS, SHIFT_COLORS } from "@/lib/constants";
import type { RosterEntry } from "@/lib/types";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  const supabase = await createClient();
  const today    = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  // Build Mon–Fri dates for this week
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const startDate = format(weekDays[0], "yyyy-MM-dd");
  const endDate   = format(weekDays[4], "yyyy-MM-dd");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entriesRaw } = await supabase
    .from("roster_entries")
    .select("*, officer:profiles(full_name, staff_id, role), location:locations(name, code)")
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date")
    .order("shift_type");
  const entries = entriesRaw as RosterEntry[] | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: locationsRaw } = await supabase
    .from("locations")
    .select("*")
    .order("display_order");
  const locations = locationsRaw as import("@/lib/types").Location[] | null;

  // Group entries by date then location
  const byDate: Record<string, Record<string, RosterEntry[]>> = {};
  (entries ?? []).forEach(entry => {
    const date = entry.work_date;
    const loc  = entry.location?.name ?? "Unassigned";
    if (!byDate[date]) byDate[date] = {};
    if (!byDate[date][loc]) byDate[date][loc] = [];
    byDate[date][loc].push(entry as RosterEntry);
  });

  // Stats for today
  const todayStr   = format(today, "yyyy-MM-dd");
  const todayAll   = (entries ?? []).filter(e => e.work_date === todayStr);
  const oncallCount   = todayAll.filter(e => e.shift_type === "oncall").length;
  const postcallCount = todayAll.filter(e => e.shift_type === "postcall").length;
  const presentCount  = todayAll.filter(e => e.shift_type === "regular").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-sm text-gray-500">
            Week of {format(weekDays[0], "d MMM")} – {format(weekDays[4], "d MMM yyyy")}
          </p>
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Regular today",   val: presentCount,  color: "bg-brand-50 text-brand-700" },
          { label: "On-call tonight", val: oncallCount,   color: "bg-purple-50 text-purple-700" },
          { label: "Post-call today", val: postcallCount, color: "bg-orange-50 text-orange-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-bold font-mono">{s.val}</p>
            <p className="text-xs font-medium opacity-80 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly roster table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                Location
              </th>
              {weekDays.map(day => (
                <th
                  key={day.toString()}
                  className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider
                    ${isToday(day)
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-500"}`}
                >
                  {format(day, "EEE d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(locations ?? []).map(loc => (
              <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-700 text-xs leading-snug">
                  {loc.name}
                  <span className="block text-gray-400 font-normal">
                    min {loc.min_staff}
                    {loc.max_staff !== loc.min_staff ? `–${loc.max_staff}` : ""}
                  </span>
                </td>
                {weekDays.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const cell    = byDate[dateStr]?.[loc.name] ?? [];
                  const understaff = cell.length < loc.min_staff;
                  return (
                    <td
                      key={dateStr}
                      className={`px-2 py-2 align-top text-center
                        ${isToday(day) ? "bg-brand-50/40" : ""}
                        ${understaff && cell.length > 0 ? "bg-red-50/40" : ""}`}
                    >
                      {cell.length === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          {cell.map(entry => (
                            <span
                              key={entry.id}
                              title={`${entry.officer?.full_name} — ${SHIFT_LABELS[entry.shift_type]}`}
                              className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium truncate max-w-[80px]
                                ${SHIFT_COLORS[entry.shift_type]}`}
                            >
                              {entry.officer?.full_name.split(" ").pop()}
                            </span>
                          ))}
                          {understaff && (
                            <span className="text-[10px] text-red-500 font-semibold">
                              ⚠ {cell.length}/{loc.min_staff}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {Object.entries(SHIFT_LABELS).map(([key, label]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${SHIFT_COLORS[key]}`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-red-50 text-red-600">
          <span>⚠</span> Understaffed
        </span>
      </div>
    </div>
  );
}
