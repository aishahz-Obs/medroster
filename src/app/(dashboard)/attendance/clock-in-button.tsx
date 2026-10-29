"use client";

import { useState, useTransition } from "react";
import { Clock, AlertCircle, Loader2, BookOpen, Moon } from "lucide-react";
import { recordAttendance } from "./actions";

const DUTY_LOCATIONS = [
  "Labour Unit",
  "PAC 3",
  "PAC 4",
  "EPAU/ED",
  "Ward 8A",
  "Ward 8B",
  "Maternity OT",
  "General OT",
  "Clinic",
  "Periphery/Emergency GOT",
];

const ONCALL_LOCATIONS = [
  "LDU",
  "PAC",
  "EPAU/ED",
  "Ward 8A",
  "Ward 8B",
];

const WORK_STATUS_OPTIONS = [
  { value: "office_hour", label: "Office Hour" },
  { value: "oncall",      label: "On-Call Tonight" },
  { value: "postcall",    label: "Post-Call" },
  { value: "course",      label: "Course" },
];

interface Props {
  userId:   string;
  workDate: string;
}

export function ClockInButton({ userId, workDate }: Props) {
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [date,           setDate]           = useState(workDate);
  const [time,           setTime]           = useState(defaultTime);
  const [location,       setLocation]       = useState("");
  const [workStatus,     setWorkStatus]     = useState("");
  const [oncallLoc,      setOncallLoc]      = useState("");
  const [courseName,     setCourseName]     = useState("");
  const [courseLocation, setCourseLocation] = useState("");
  const [courseTime,     setCourseTime]     = useState("");
  const [error,          setError]          = useState<string | null>(null);

  const isOncall = workStatus === "oncall";
  const isCourse = workStatus === "course";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await recordAttendance({
        date, time, location, workStatus,
        oncallLocation: isOncall ? oncallLoc     : undefined,
        courseName:     isCourse ? courseName     : undefined,
        courseLocation: isCourse ? courseLocation : undefined,
        courseTime:     isCourse ? courseTime     : undefined,
      });
      if (result.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Time of arrival</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      {/* Location of duty */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Location of duty</label>
        <select value={location} onChange={e => setLocation(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">Select location…</option>
          {DUTY_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Status of work */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Status of work</label>
        <select value={workStatus} onChange={e => setWorkStatus(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">Select status…</option>
          {WORK_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
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
            <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required={isCourse}
              placeholder="e.g. Advanced Obstetric Life Support"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Course venue</label>
            <input type="text" value={courseLocation} onChange={e => setCourseLocation(e.target.value)} required={isCourse}
              placeholder="e.g. Hospital Kuala Lumpur"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Course time / duration</label>
            <input type="text" value={courseTime} onChange={e => setCourseTime(e.target.value)} required={isCourse}
              placeholder="e.g. 8:00 AM – 5:00 PM"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700
                   disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
        {isPending ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
        {isPending ? "Saving…" : "Record Attendance"}
      </button>
    </form>
  );
}
