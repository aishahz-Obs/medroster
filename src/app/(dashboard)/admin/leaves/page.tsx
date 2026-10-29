import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS,
} from "@/lib/constants";
import { ApprovalActions } from "./approval-actions";

export const metadata = { title: "Leave Approvals" };

export default async function AdminLeavesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only admin / superadmin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await (supabase.from("profiles") as any).select("role").eq("id", user.id).single();
  const profile = profileRaw as { role: string } | null;
  if (!profile || profile.role === "user") redirect("/leave");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: requestsRaw } = await (supabase.from("leave_requests") as any)
    .select("*, officer:profiles!leave_requests_officer_id_fkey(full_name, staff_id, email)")
    .in("status", ["pending"])
    .order("submitted_at", { ascending: true });
  const requests = requestsRaw as (import("@/lib/types").LeaveRequest & { officer: { full_name: string; staff_id: string; email: string } | null })[] | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentRaw } = await (supabase.from("leave_requests") as any)
    .select("*, officer:profiles!leave_requests_officer_id_fkey(full_name, staff_id)")
    .in("status", ["approved", "rejected", "blocked"])
    .order("reviewed_at", { ascending: false })
    .limit(15);
  const recent = recentRaw as (import("@/lib/types").LeaveRequest & { officer: { full_name: string; staff_id: string } | null })[] | null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-sm text-gray-500">{requests?.length ?? 0} pending application{requests?.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Pending */}
      {(!requests || requests.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-sm text-gray-400 mb-6">
          No pending leave applications.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {req.officer?.full_name}
                    </span>
                    <span className="text-xs text-gray-500">{req.officer?.staff_id}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAVE_STATUS_COLORS[req.status]}`}>
                      {LEAVE_STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>{LEAVE_TYPE_LABELS[req.leave_type]}</strong>
                    {" "}· {format(new Date(req.start_date), "d MMM yyyy")}
                    {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), "d MMM yyyy")}`}
                    {" "}· <strong>{req.days_count}</strong> day{req.days_count !== 1 ? "s" : ""}
                  </p>
                  {req.reason && (
                    <p className="text-xs text-gray-500 mt-1">Reason: {req.reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {format(new Date(req.submitted_at), "d MMM yyyy, h:mm a")}
                    {req.evidence_path && " · Evidence attached"}
                  </p>
                </div>
                {/* Actions — client component for interactivity */}
                <ApprovalActions
                  requestId={req.id}
                  evidencePath={req.evidence_path}
                  isSuperadmin={profile.role === "superadmin"}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent decisions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Decisions</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {(!recent || recent.length === 0) ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No recent decisions.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map(req => (
                <li key={req.id} className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900">{req.officer?.full_name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {LEAVE_TYPE_LABELS[req.leave_type]} · {req.days_count}d ·{" "}
                      {format(new Date(req.start_date), "d MMM")}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAVE_STATUS_COLORS[req.status]}`}>
                    {LEAVE_STATUS_LABELS[req.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
