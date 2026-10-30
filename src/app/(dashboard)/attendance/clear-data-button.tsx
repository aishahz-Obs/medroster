"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { clearAllAttendanceData } from "./actions";

export function ClearDataButton() {
  const [confirm, setConfirm]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const [done, setDone]         = useState(false);

  function handleClear() {
    startTransition(async () => {
      await clearAllAttendanceData();
      setDone(true);
      setConfirm(false);
      setTimeout(() => { window.location.reload(); }, 800);
    });
  }

  if (done) return <span className="text-xs text-green-600 font-medium">Cleared!</span>;

  return (
    <div className="flex items-center gap-2">
      {confirm ? (
        <>
          <span className="text-xs text-red-600 font-medium">Delete ALL attendance, roster & leave data?</span>
          <button onClick={handleClear} disabled={isPending}
            className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-2 py-1 rounded-lg disabled:opacity-60">
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {isPending ? "Clearing…" : "Yes, clear all"}
          </button>
          <button onClick={() => setConfirm(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg border border-gray-200">
            Cancel
          </button>
        </>
      ) : (
        <button onClick={() => setConfirm(true)}
          className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 font-medium px-2.5 py-1.5 rounded-lg transition-colors">
          <AlertTriangle size={12} />
          Clear Test Data
        </button>
      )}
    </div>
  );
}
