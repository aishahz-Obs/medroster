import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
import { LayoutGrid, AlertTriangle } from "lucide-react";
import { MIN_DAILY_HEADCOUNT, SHIFT_LABELS, SHIFT_COLORS } from "@/lib/constants";
import type { RosterEntry, Profile, Location } from "@/lib/types";

export const metadata = { title: "Manage Roster" };

export default async function AdminRosterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meRaw } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  const me = meRaw as { role: string } | null;
  if (!me || me.role === "user") redirect("/roster");

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const [{ data: entriesRaw }, { data: officersRaw }, { data: locationsRaw }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("roster_entries") as any)
      .select("*, officer:profiles!roster_entries_officer_id_fkey(full_name, staff_id), location:locations!roster_entries_location_id_fkey(name)")
      .gte("entry_date", format(weekStart, "yyyy-MM-dd"))
      .lte("entry_date", format(addDays(weekStart, 4), "yyyy-MM-dd"))
      .order("work_date"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("id, full_name, staff_id").eq("is_active", true).order("full_name"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("locations") as any).select("*").eq("is_active", true).order("name"),
  ]);

  const entries = (entriesRaw as (RosterEntry & { officer: Pick<Profile, "full_name" | "staff_id"> | null; location: Pick<Location, "name"> | null })[] | null) ?? [];
  const officers  = (officersRaw  as Pick<Profile, "id" | "full_name" | "staff_id">[] | null) ?? [];
  const locations = (locationsRaw as Location[] | null) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutGrid className="text-gray-500" size={22} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Roster</h1>
          <p className="text-sm text-gray-500">
            Week of {format(weekStart, "d MMM")} – {format(addDays(weekStart, 4), "d MMM yyyy")}
          </p>
        </div>
      </div>

      {/* Weekly overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Day</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Officers</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">On-Call</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Post-Call</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {weekDays.map(day => {
              const dateStr   = format(day, "yyyy-MM-dd");
              const dayEnts   = entries.filter(e => e.entry_date === dateStr);
              const total     = dayEnts.length;
              const oncall    = dayEnts.filter(e => e.shift === "oncall").length;
              const postcall  = dayEnts.filter(e => e.shift === "postcall").length;
              const isUnder   = total < MIN_DAILY_HEADCOUNT;
              return (
                <tr key={dateStr} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">{format(day, "EEE d MMM")}</td>
                  <td className={`px-3 py-3 text-center font-mono font-bold ${isUnder ? "text-red-600" : "text-gray-900"}`}>{total}</td>
                  <td className="px-3 py-3 text-center font-mono text-purple-700">{oncall}</td>
                  <td className="px-3 py-3 text-center font-mono text-orange-600">{postcall}</td>
                  <td className="px-3 py-3 text-center">
                    {isUnder ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                        <AlertTriangle size={11} /> Understaffed
                      </span>
                    ) : (
                      <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Officer/location breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Locations ({locations.length})</h2>
          <ul className="space-y-1.5">
            {locations.map(l => (
              <li key={l.id} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                {l.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Shift Legend</h2>
          <ul className="space-y-2">
            {Object.entries(SHIFT_LABELS).map(([key, label]) => (
              <li key={key} className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SHIFT_COLORS[key]}`}>{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            Minimum headcount per day: <strong>{MIN_DAILY_HEADCOUNT}</strong> officers
          </p>
        </div>
      </div>
    </div>
  );
}
