import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS, ANNUAL_LEAVE_DAYS,
} from "@/lib/constants";

export const metadata = { title: "My Leave" };

export default async function LeavePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const currentYear = new Date().getFullYear();

  const [{ data: requestsRaw }, { data: balanceRaw }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("*")
      .eq("officer_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("leave_balances")
      .select("*")
      .eq("officer_id", user.id)
      .eq("year", currentYear)
      .single(),
  ]);
  const requests = requestsRaw as import("@/lib/types").LeaveRequest[] | null;
  const balance  = balanceRaw  as import("@/lib/types").LeaveBalance  | null;

  const usedDays    = balance?.used_days    ?? 0;
  const pendingDays = balance?.pending_days ?? 0;
  const remaining   = ANNUAL_LEAVE_DAYS - usedDays - pendingDays;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave</h1>
          <p className="text-sm text-gray-500">Annual leave applications for {currentYear}</p>
        </div>
        <Link
          href="/leave/apply"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm
                     font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Apply for leave
        </Link>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total entitlement", val: ANNUAL_LEAVE_DAYS, color: "text-gray-900" },
          { label: "Used",              val: usedDays,           color: "text-red-600" },
          { label: "Remaining",         val: remaining,          color: remaining < 5 ? "text-red-600" : "text-teal-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingDays > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <strong>{pendingDays} day{pendingDays !== 1 ? "s" : ""}</strong> pending approval — not yet deducted from balance.
        </div>
      )}

      {/* Leave history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Leave History</h2>
        </div>
        {(!requests || requests.length === 0) ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            No leave applications yet.
            <br />
            <Link href="/leave/apply" className="text-brand-600 font-medium mt-1 inline-block">
              Apply for leave →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {requests.map(req => (
              <li key={req.id} className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {LEAVE_TYPE_LABELS[req.leave_type]}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAVE_STATUS_COLORS[req.status]}`}>
                      {LEAVE_STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(req.start_date), "d MMM yyyy")}
                    {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), "d MMM yyyy")}`}
                    {" "}· {req.days_count} day{req.days_count !== 1 ? "s" : ""}
                  </p>
                  {req.block_reason && (
                    <p className="text-xs text-red-600 mt-0.5">Blocked: {req.block_reason}</p>
                  )}
                  {req.review_notes && req.status === "rejected" && (
                    <p className="text-xs text-gray-500 mt-0.5">Note: {req.review_notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {format(new Date(req.submitted_at), "d MMM")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
