"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Location {
  id: number;
  name: string;
}

interface Props {
  userId:    string;
  workDate:  string;
  locations: Location[];
}

export function ClockInButton({ userId, workDate, locations }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [date,     setDate]     = useState(workDate);
  const [time,     setTime]     = useState(defaultTime);
  const [location, setLocation] = useState<string>("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clockedInAt = new Date(`${date}T${time}:00`).toISOString();
    const locationName = locations.find(l => String(l.id) === location)?.name ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from("clock_ins") as any).insert({
      officer_id:    userId,
      work_date:     date,
      clocked_in_at: clockedInAt,
      location_name: locationName,
      status:        "present",
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

      {/* Location */}
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
          {locations.map(l => (
            <option key={l.id} value={String(l.id)}>{l.name}</option>
          ))}
        </select>
      </div>

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
        {loading
          ? <Loader2 size={18} className="animate-spin" />
          : <Clock size={18} />}
        {loading ? "Saving…" : "Record Attendance"}
      </button>
    </form>
  );
}
