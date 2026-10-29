"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarClock, Clock, User, LayoutGrid } from "lucide-react";

const MOBILE_ITEMS = [
  { href: "/roster",       label: "Roster",   Icon: Calendar },
  { href: "/leave",        label: "Leave",    Icon: CalendarClock },
  { href: "/attendance",   label: "Clock In", Icon: Clock },
  { href: "/admin/leaves", label: "Admin",    Icon: LayoutGrid },
  { href: "/profile",      label: "Profile",  Icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex md:hidden
                    safe-area-pb" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {MOBILE_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors
              ${active ? "text-brand-600" : "text-gray-400"}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
