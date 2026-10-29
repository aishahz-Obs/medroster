import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, CalendarOff, Clock } from "lucide-react";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meRaw } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  const me = meRaw as { role: string } | null;
  if (!me || me.role === "user") redirect("/roster");

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthStart   = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const today        = new Date().toISOString().slice(0, 10);

  // Parallel data fetches
  const [
    { data: officersRaw },
    { data: leaveThisMonthRaw },
    { data: pendingRaw },
    { data: attendanceTodayRaw },
    { data: leaveByTypeRaw },
    { data: miaThisMonthRaw },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("id, full_name, is_active").eq("is_active", true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("leave_requests") as any)
      .select("id, leave_type, days_count, status")
      .gte("start_date", monthStart)
      .in("status", ["approved", "pending"]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("leave_requests") as any)
      .select("id")
      .eq("status", "pending"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("clock_ins") as any)
      .select("id, officer_id, status")
      .eq("work_date", today),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("leave_requests") as any)
      .select("leave_type, days_count")
      .gte("start_date", `${currentYear}-01-01`)
      .eq("status", "approved"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("clock_ins") as any)
      .select("id")
      .gte("work_date", monthStart)
      .eq("status", "mia"),
  ]);

  const officers        = (officersRaw as { id: string }[] | null) ?? [];
  const leaveThisMonth  = (leaveThisMonthRaw as { leave_type: string; days_count: number; status: string }[] | null) ?? [];
  const pending         = (pendingRaw as { id: string }[] | null) ?? [];
  const attendanceToday = (attendanceTodayRaw as { officer_id: string; status: string }[] | null) ?? [];
  const leaveByType     = (leaveByTypeRaw as { leave_type: string; days_count: number }[] | null) ?? [];
  const miaThisMonth    = (miaThisMonthRaw as { id: string }[] | null) ?? [];

  const presentToday    = attendanceToday.filter(a => a.status === "present").length;
  const leaveDaysMonth  = leaveThisMonth.filter(l => l.status === "approved").reduce((s, l) => s + l.days_count, 0);

  // Leave by type summary
  const leaveTypeSummary = Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => ({
    type, label,
    days: leaveByType.filter(l => l.leave_type === type).reduce((s, l) => s + l.days_count, 0),
  })).filter(t => t.days > 0).sort((a, b) => b.days - a.days);

  const statCards = [
    { label: "Active Officers",        val: officers.length,       icon: <Users size={20} />,      color: "text-brand-600" },
    { label: "Present Today",          val: presentToday,          icon: <Clock size={20} />,      color: "text-teal-600" },
    { label: "Pending Leave",          val: pending.length,        icon: <TrendingUp size={20} />, color: "text-amber-600" },
    { label: "Leave Days This Month",  val: leaveDaysMonth,        icon: <CalendarOff size={20} />,color: "text-red-500" },
    { label: "MIA This Month",         val: miaThisMonth.length,   icon: <Users size={20} />,      color: "text-red-700" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-gray-500" size={22} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">{currentYear} department overview</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4">
            <div className={`mb-1.5 ${s.color}`}>{s.icon}</div>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leave by type */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Leave Days by Type — {currentYear}</h2>
        </div>
        {leaveTypeSummary.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No approved leave recorded yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {leaveTypeSummary.map(t => {
              const pct = Math.round((t.days / (leaveTypeSummary.reduce((s, x) => s + x.days, 0))) * 100);
              return (
                <li key={t.type} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{t.label}</span>
                    <span className="text-sm font-bold text-gray-900">{t.days} days</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Today attendance breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Today&apos;s Attendance Breakdown</h2>
        </div>
        <div className="px-4 py-4 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Clocked In",   val: presentToday,                                                     color: "text-teal-600" },
            { label: "MIA",          val: attendanceToday.filter(a => a.status === "mia").length,            color: "text-red-600" },
            { label: "Not Recorded", val: Math.max(0, officers.length - attendanceToday.length),             color: "text-gray-400" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
