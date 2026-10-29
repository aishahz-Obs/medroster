"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { editAttendance } from "./actions";

interface Props {
  record: {
    id:              string;
    attendance_date: string;
    clocked_in_at:   string | null;
    location_name:   string | null;
    status:          string;
    notes:           string | null;
    officer_name?:   string;
  };
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "mia",     label: "MIA" },
  { value: "el",      label: "Emergency Leave" },
  { value: "absent",  label: "Absent" },
];

export function EditAttendanceModal({ record }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [date,     setDate]     = useState(record.attendance_date);
  const [time,     setTime]     = useState(
    record.clocked_in_at
      ? new Date(record.clocked_in_at).toTimeString().slice(0, 5)
      : ""
  );
  const [location, setLocation] = useState(record.location_name ?? "");
  const [status,   setStatus]   = useState(record.status);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clockedInAt = time
      ? new Date(`${date}T${time}:00`).toISOString()
      : record.clocked_in_at ?? new Date(`${date}T08:00:00`).toISOString();

    startTransition(async () => {
      const result = await editAttendance(record.id, {
        attendance_date: date,
        clocked_in_at:   clockedInAt,
        location_name:   location,
        status,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => { setOpen(false); setSuccess(false); }, 1200);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); setSuccess(false); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title="Edit record"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit Attendance</h2>
                {record.officer_name && (
                  <p className="text-xs text-gray-500 mt-0.5">{record.officer_name}</p>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-8 text-teal-600">
                <CheckCircle size={36} />
                <p className="font-semibold text-sm">Updated successfully</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Clock-in time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Labour Unit"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600
                               hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60">
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
