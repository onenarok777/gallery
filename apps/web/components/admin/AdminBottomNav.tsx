"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Home } from "lucide-react";

const NAV_ITEMS = [
  { label: "หน้าแรก", href: "/", icon: Home },
  { label: "Dashboard", href: "/administrator", icon: LayoutDashboard },
  { label: "จัดการ Event", href: "/administrator/events", icon: Calendar },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-admin-base/90 backdrop-blur-xl border-t border-neutral-100 dark:border-admin-border px-2 pb-safe-area-inset-bottom shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/administrator" && item.href !== "/" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                isActive
                  ? "text-violet-600 dark:text-[#7aa2f7]"
                  : "text-neutral-400 dark:text-admin-text-dim hover:text-neutral-600 dark:hover:text-admin-text-muted"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 active:scale-90" />
              <span className={`text-[10px] tracking-tight font-bold transition-all duration-300 ${isActive ? "opacity-100" : "opacity-80"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-violet-600 dark:bg-[#7aa2f7] shadow-[0_0_8px_rgba(124,58,237,0.5)] animate-in fade-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
