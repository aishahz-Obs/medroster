"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";

export function WeekNav({ weekStart }: { weekStart: Date }) {
  const router = useRouter();

  function go(dir: "prev" | "next") {
    const target = dir === "prev" ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1);
    router.push(`/roster?week=${format(target, "yyyy-MM-dd")}`);
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => go("prev")}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Previous week">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => router.push("/roster")}
        className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        This week
      </button>
      <button onClick={() => go("next")}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Next week">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
