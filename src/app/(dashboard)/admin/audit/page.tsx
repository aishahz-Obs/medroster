import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

export const metadata = { title: "Audit Trail" };

const ACTION_LABELS: Record<string, string> = {
  approve_leave:  "Approved leave",
  reject_leave:   "Rejected leave",
  block_leave:    "Blocked leave",
  cancel_leave:   "Cancelled leave",
  clock_in:       "Clocked in",
  flag_mia:       "Flagged MIA",
  update_profile: "Updated profile",
  create_officer: "Created officer",
};

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meRaw } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  const me = meRaw as { role: string } | null;
  if (!me || me.role === "user") redirect("/roster");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logsRaw } = await (supabase.from("audit_logs") as any)
    .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name, staff_id)")
    .order("created_at", { ascending: false })
    .limit(100);

  const logs = logsRaw as (import("@/lib/types").AuditLog & {
    actor: { full_name: string; staff_id: string } | null;
  })[] | null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="text-gray-500" size={22} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500">Immutable log of all system actions (last 100)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {(!logs || logs.length === 0) ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">No audit events recorded yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map(log => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      by <strong>{log.actor?.full_name ?? "System"}</strong>
                      {log.actor?.staff_id && ` (${log.actor.staff_id})`}
                      {log.target_type && ` · ${log.target_type}`}
                    </p>
                    {log.new_values && (
                      <p className="text-xs font-mono text-gray-400 mt-0.5 truncate max-w-xs">
                        {JSON.stringify(log.new_values)}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {format(new Date(log.created_at), "d MMM yyyy, h:mm a")}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
