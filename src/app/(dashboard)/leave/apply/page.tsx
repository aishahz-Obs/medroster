"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LEAVE_TYPE_LABELS, LEAVE_MIN_ADVANCE_MONTHS, LEAVE_MAX_ADVANCE_MONTHS,
  DAILY_LEAVE_CAPS, LEAVE_MAX_PER_MONTH, LEAVE_MAX_CARRYOVER, LEAVE_MAX_COURSE_MONTH,
} from "@/lib/constants";
import { addMonths, differenceInBusinessDays, addDays, format, getDay } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";
import type { LeaveType } from "@/lib/types";

const LEAVE_TYPES: LeaveType[] = ["annual", "maternity", "study", "emergency", "replacement"];

// Validate leave application against department rules
function validateLeave(
  startDate: Date,
  endDate: Date,
  leaveType: LeaveType,
  usedThisMonth: number,
  usedPrevMonth: number,
  hasCourseThisMonth: boolean,
): string | null {
  if (leaveType !== "annual") return null; // Only annual leave has strict rules

  const today    = new Date();
  const minDate  = addMonths(today, LEAVE_MIN_ADVANCE_MONTHS);
  const maxDate  = addMonths(today, LEAVE_MAX_ADVANCE_MONTHS);

  if (startDate < minDate) {
    return `Annual leave must be applied at least ${LEAVE_MIN_ADVANCE_MONTHS} months in advance (from ${format(minDate, "d MMM yyyy")}).`;
  }
  if (startDate > maxDate) {
    return `Annual leave cannot be applied more than ${LEAVE_MAX_ADVANCE_MONTHS} months in advance.`;
  }

  // Check day-of-week caps
  let d = startDate;
  while (d <= endDate) {
    const dow = getDay(d); // 0=Sun, 6=Sat
    const isoDow = dow === 0 ? 7 : dow; // 1=Mon..7=Sun
    const cap = DAILY_LEAVE_CAPS[isoDow];
    if (cap !== undefined) {
      // Simplified: warn about near-cap days (server does the real count)
    }
    d = addDays(d, 1);
  }

  // Monthly quota
  const days = Math.max(1, differenceInBusinessDays(addDays(endDate, 1), startDate));
  const monthCap = hasCourseThisMonth
    ? LEAVE_MAX_COURSE_MONTH
    : usedPrevMonth === 0
    ? LEAVE_MAX_CARRYOVER
    : LEAVE_MAX_PER_MONTH;

  if (usedThisMonth + days > monthCap) {
    return `This application exceeds your monthly cap of ${monthCap} day${monthCap > 1 ? "s" : ""}. You have used ${usedThisMonth} day${usedThisMonth !== 1 ? "s" : ""} this month.`;
  }

  return null;
}

export default function LeaveApplyPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [reason,    setReason]    = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const minApply = format(addMonths(new Date(), LEAVE_MIN_ADVANCE_MONTHS), "yyyy-MM-dd");
  const maxApply = format(addMonths(new Date(), LEAVE_MAX_ADVANCE_MONTHS), "yyyy-MM-dd");

  const daysCount =
    startDate && endDate
      ? Math.max(0, differenceInBusinessDays(addDays(new Date(endDate), 1), new Date(startDate)))
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) { setError("Please select start and end dates."); return; }
    if (!file)                  { setError("Evidence document is required. Please upload a file."); return; }

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setLoading(false); return; }

    // Upload evidence file
    const fileExt  = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("leave-evidence")
      .upload(filePath, file);

    if (uploadError) {
      setError(`File upload failed: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    // Submit leave request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from("leave_requests") as any).insert({
      officer_id:    user.id,
      leave_type:    leaveType,
      start_date:    startDate,
      end_date:      endDate,
      days_count:    daysCount,
      reason:        reason || null,
      evidence_path: filePath,
      status:        "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/leave"), 2000);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-teal-600">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted</h2>
        <p className="text-sm text-gray-500">Your leave request has been sent for approval. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leave" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-sm text-gray-500">All fields marked * are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-5">
        {/* Leave type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leave type *</label>
          <select
            value={leaveType}
            onChange={e => setLeaveType(e.target.value as LeaveType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {LEAVE_TYPES.map(t => (
              <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start date *</label>
            <input
              type="date"
              required
              value={startDate}
              min={leaveType === "annual" ? minApply : undefined}
              max={leaveType === "annual" ? maxApply : undefined}
              onChange={e => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">End date *</label>
            <input
              type="date"
              required
              value={endDate}
              min={startDate || undefined}
              max={leaveType === "annual" ? maxApply : undefined}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {daysCount > 0 && (
          <div className="bg-brand-50 rounded-lg px-3 py-2.5 text-sm text-brand-700 font-medium">
            {daysCount} working day{daysCount !== 1 ? "s" : ""} selected
          </div>
        )}

        {leaveType === "annual" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Annual leave must be applied <strong>{LEAVE_MIN_ADVANCE_MONTHS}–{LEAVE_MAX_ADVANCE_MONTHS} months</strong> in advance.
              Max <strong>2 days/month</strong> (4 days if previous month had no leave, 2 days max in a course month).
            </span>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Optional — briefly describe your reason for leave"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Evidence upload — required */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Supporting evidence * <span className="text-red-500">(required)</span>
          </label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300
                             rounded-lg px-4 py-6 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500 text-center">
              {file ? (
                <span className="text-brand-700 font-medium">{file.name}</span>
              ) : (
                <>Click to upload or drag &amp; drop<br /><span className="text-xs">PDF, JPG, PNG (max 5 MB)</span></>
              )}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/leave"
            className="flex-1 text-center py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold
                       py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}
