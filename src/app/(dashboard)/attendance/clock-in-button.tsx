"use client";

import { useState, useTransition } from "react";
import { Clock, AlertCircle, Loader2, BookOpen, Moon, Calendar, FileText, Leaf } from "lucide-react";
import { recordAttendance, recordLeave } from "./actions";

const DUTY_LOCATIONS = [
  "Labour Unit",
  "PAC 3 & 4",
  "EPAU / ED",
  "Ward 8A",
  "Ward 8B",
  "Maternity OT",
  "General OT",
  "Clinic",
  "Periphery / Emergency GOT",
];

const ONCALL_LOCATIONS = ["LDU", "PAC", "EPAU/ED", "Ward 8A", "Ward 8B"];

const WORK_STATUS_OPTIONS = [
  { value: "office_hour",      label: "Office Hour",        group: "work" },
  { value: "oncall",           label: "On-Call Tonight",    group: "work" },
  { value: "postcall",         label: "Post-Call",          group: "work" },
  { value: "course",           label: "Course",             group: "work" },
  { value: "annual_leave",     label: "Annual Leave",       group: "leave" },
  { value: "emergency_leave",  label: "Emergency Leave",    group: "leave" },
  { value: "maternal_leave",   label: "Maternal Leave",     group: "leave" },
  { value: "study_leave",      label: "Study Leave",        group: "leave" },
  { value: "unrecorded_leave", label: "Unrecorded Leave",   group: "leave" },
];

interface Props {
  userId:   string;
  workDate: string;
}

export function ClockInButton({ userId, workDate }: Props) {
  const [isPending, startTransition] = useTransition();

  const now    = new Date();
  const pad    = (n: number) => String(n).padStart(2, "0");
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [workStatus,     setWorkStatus]     = useState("");
  const [location,       setLocation]       = useState("");
  const [date,           setDate]           = useState(workDate);
  const [time,           setTime]           = useState(defaultTime);
  const [oncallLoc,      setOncallLoc]      = useState("");
  const [courseName,     setCourseName]     = useState("");
  const [courseLocation, setCourseLocation] = useState("");
  const [courseTime,     setCourseTime]     = useState("");
  // Leave fields
  const [leaveStart,     setLeaveStart]     = useState(workDate);
  const [leaveEnd,       setLeaveEnd]       = useState(workDate);
  const [leaveReason,    setLeaveReason]    = useState("");
  const [error,          setError]          = useState<string | null>(null);
  const [done,           setDone]           = useState(false);

  const isLeave    = ["annual_leave","emergency_leave","maternal_leave","study_leave","unrecorded_leave"].includes(workStatus);
  const isOncall   = workStatus === "oncall";
  const isCourse   = workStatus === "course";
  const needReason = workStatus === "emergency_leave" || workStatus === "unrecorded_leave";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isLeave) {
      startTransition(async () => {
        const result = await recordLeave({
          leaveType:   workStatus,
          startDate:   leaveStart,
          endDate:     leaveEnd,
          reason:      needReason ? leaveReason : undefined,
        });
        if (result.error) setError(result.error);
        else setDone(true);
      });
    } else {
      startTransition(async () => {
        const result = await recordAttendance({
          date, time, location, workStatus,
          oncallLocation: isOncall ? oncallLoc      : undefined,
          courseName:     isCourse ? courseName      : undefined,
          courseLocation: isCourse ? courseLocation  : undefined,
          courseTime:     isCourse ? courseTime      : undefined,
        });
        if (result.error) setError(result.error);
        else setDone(true);
      });
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-teal-700 text-sm font-semibold py-2">
        <Clock size={16} />
        {isLeave ? "Leave submitted successfully." : "Attendance recorded."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      {/* 1. Status of work — always first */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Status of work</label>
        <select value={workStatus} onChange={e => { setWorkStatus(e.target.value); setError(null); }} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">Select status…</option>
          <optgroup label="── Work ──">
            {WORK_STATUS_OPTIONS.filter(o => o.group === "work").map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </optgroup>
          <optgroup label="── Leave ──">
            {WORK_STATUS_OPTIONS.filter(o => o.group === "leave").map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Leave flow */}
      {isLeave && (
        <>
          {/* Leave date range */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <Calendar size={15} />
              Leave Duration
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start date</label>
                <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End date</label>
                <input type="date" value={leaveEnd} min={leaveStart} onChange={e => setLeaveEnd(e.target.value)} required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          {/* Reason — required for Emergency / Unrecorded */}
          {needReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <FileText size={15} />
                Reason <span className="text-red-500">*</span>
              </div>
              <textarea
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                required={needReason}
                rows={3}
                placeholder="State the reason for this leave…"
                className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          )}
        </>
      )}

      {/* Work flow: Location → Date → Time */}
      {!isLeave && workStatus !== "" && (
        <>
          {/* 2. Location of duty */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Location of duty</label>
            <select value={location} onChange={e => setLocation(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select location…</option>
              {DUTY_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* 3. Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* 4. Time of arrival */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Time of arrival</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* On-Call location panel */}
          {isOncall && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                <Moon size={15} />
                On-Call Coverage Location Tonight
              </div>
              <select value={oncallLoc} onChange={e => setOncallLoc(e.target.value)} required
                className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Select on-call location…</option>
                {ONCALL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Course details panel */}
          {isCourse && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <BookOpen size={15} />
                Course Details
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name of course</label>
                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required
                  placeholder="e.g. Advanced Obstetric Life Support"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course venue</label>
                <input type="text" value={courseLocation} onChange={e => setCourseLocation(e.target.value)} required
                  placeholder="e.g. Hospital Kuala Lumpur"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course time / duration</label>
                <input type="text" value={courseTime} onChange={e => setCourseTime(e.target.value)} required
                  placeholder="e.g. 8:00 AM – 5:00 PM"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {workStatus !== "" && (
        <button type="submit" disabled={isPending}
          className={`flex items-center justify-center gap-2 w-full disabled:opacity-60 text-white
                     font-semibold py-3 rounded-xl transition-colors text-sm
                     ${isLeave ? "bg-green-600 hover:bg-green-700" : "bg-teal-600 hover:bg-teal-700"}`}>
          {isPending
            ? <Loader2 size={18} className="animate-spin" />
            : isLeave ? <Leaf size={18} /> : <Clock size={18} />}
          {isPending ? "Saving…" : isLeave ? "Submit Leave" : "Record Attendance"}
        </button>
      )}
    </form>
  );
}
