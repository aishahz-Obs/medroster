"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock, AlertCircle, Loader2, BookOpen } from "lucide-react";

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

const WORK_STATUS_OPTIONS = [
  { value: "office_hour", label: "Office Hour" },
  { value: "oncall",      label: "On-Call" },
  { value: "postcall",    label: "Post-Call" },
  { value: "course",      label: "Course" },
];

interface Props {
  userId:   string;
  workDate: string;
}

export function ClockInButton({ userId, workDate }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [date,           setDate]           = useState(workDate);
  const [time,           setTime]           = useState(defaultTime);
  const [location,       setLocation]       = useState("");
  const [workStatus,     setWorkStatus]     = useState("");
  const [courseName,     setCourseName]     = useState("");
  const [courseLocation, setCourseLocation] = useState("");
  const [courseTime,     setCourseTime]     = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const isCourse = workStatus === "course";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clockedInAt = new Date(`${date}T${time}:00`).toISOString();

    const notesData: Record<string, string> = { work_type: workStatus };
    if (isCourse) {
      notesData.course_name     = courseName;
      notesData.course_location = courseLocation;
      notesData.course_time     = courseTime;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from("clock_ins") as any).insert({
      officer_id:      userId,
      attendance_date: date,
      clocked_in_at:   clockedInAt,
      location_name:   location,
      status:          "present",
      notes:           JSON.stringify(notesData),
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Time of arrival</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Location of duty */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Location of duty</label>
        <select
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select location…</option>
          {DUTY_LOCATIONS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Status of work */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Status of work</label>
        <select
          value={workStatus}
          onChange={e => setWorkStatus(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select status…</option>
          {WORK_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Course details — shown only when Course is selected */}
      {isCourse && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1">
            <BookOpen size={15} />
            Course Details
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name of course</label>
            <input
              type="text"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              required={isCourse}
              placeholder="e.g. Advanced Obstetric Life Support"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Course location / venue</label>
            <input
              type="text"
              value={courseLocation}
              onChange={e => setCourseLocation(e.target.value)}
              required={isCourse}
              placeholder="e.g. Hospital Kuala Lumpur"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Course time / duration</label>
            <input
              type="text"
              value={courseTime}
              onChange={e => setCourseTime(e.target.value)}
              required={isCourse}
              placeholder="e.g. 8:00 AM – 5:00 PM"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700
                   disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
        {loading ? "Saving…" : "Record Attendance"}
      </button>
    </form>
  );
}
