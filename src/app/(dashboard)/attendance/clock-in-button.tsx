"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

interface Props {
  userId: string;
  workDate: string;
}

export function ClockInButton({ userId, workDate }: Props) {
  const router  = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClockIn() {
    setLoading(true);
    setError(null);

    // Get geolocation
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Location declined or unavailable — still allow clock-in without coords
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from("clock_ins") as any).insert({
      officer_id:    userId,
      work_date:     workDate,
      clocked_in_at: new Date().toISOString(),
      latitude:      lat,
      longitude:     lng,
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
    <div className="flex flex-col gap-3">
      <button
        onClick={handleClockIn}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700
                   disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <MapPin size={18} />
        )}
        {loading ? "Recording location…" : "Clock In Now"}
      </button>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <MapPin size={11} />
        Your GPS location will be recorded with your clock-in
      </p>
      {error && (
        <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}
