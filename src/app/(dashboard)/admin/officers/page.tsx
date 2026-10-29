import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Officers" };

export default async function OfficersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meRaw } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  const me = meRaw as { role: string } | null;
  if (!me || me.role === "user") redirect("/roster");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: officersRaw } = await (supabase.from("profiles") as any)
    .select("*")
    .order("full_name", { ascending: true });
  const officers = officersRaw as Profile[] | null;

  const counts = {
    total:      officers?.length ?? 0,
    active:     officers?.filter(o => o.is_active).length ?? 0,
    superadmin: officers?.filter(o => o.role === "superadmin").length ?? 0,
    admin:      officers?.filter(o => o.role === "admin").length ?? 0,
  };

  const roleColors: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-800",
    admin:      "bg-brand-100 text-brand-800",
    user:       "bg-gray-100 text-gray-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Officers</h1>
        <p className="text-sm text-gray-500">All department medical officers</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",      val: counts.total,      icon: <Users size={18} />,     color: "text-gray-700" },
          { label: "Active",     val: counts.active,     icon: <UserCheck size={18} />, color: "text-teal-600" },
          { label: "Superadmin", val: counts.superadmin, icon: <Shield size={18} />,    color: "text-purple-600" },
          { label: "Admin",      val: counts.admin,      icon: <UserCheck size={18} />, color: "text-brand-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
            <div className={`mb-1 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Officers table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">All Officers</h2>
        </div>
        {(!officers || officers.length === 0) ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">No officers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff ID</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{o.full_name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{o.staff_id}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{o.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[o.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {ROLE_LABELS[o.role] ?? o.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        o.is_active ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-600"
                      }`}>
                        {o.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
