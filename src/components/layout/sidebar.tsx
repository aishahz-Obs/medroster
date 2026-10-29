"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, CalendarClock, Clock, User, LayoutGrid,
  CheckSquare, Users, ScrollText, BarChart3, LogOut,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { APP_NAME, NAV_ITEMS, ADMIN_NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Calendar, CalendarClock, Clock, User, LayoutGrid,
  CheckSquare, Users, ScrollText, BarChart3,
};

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const isAdmin = profile.role === "admin" || profile.role === "superadmin";

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    const Icon    = ICON_MAP[icon] ?? Calendar;
    const active  = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${active
            ? "bg-brand-600 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
      >
        <Icon size={16} />
        <span className="flex-1">{label}</span>
        {active && <ChevronRight size={14} />}
      </Link>
    );
  }

  return (
    <aside className="flex flex-col w-60 min-h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Calendar size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm">{APP_NAME}</span>
      </div>

      {/* Profile pill */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
            {profile.full_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Administration
              </span>
            </div>
            {ADMIN_NAV_ITEMS.map(item => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                     text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
