"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Image as ImageIcon } from "lucide-react";
import { Heading, Text } from "../ui/Typography";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/administrator", icon: LayoutDashboard },
  { label: "จัดการ Event", href: "/administrator/events", icon: Calendar },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-neutral-200 dark:border-admin-border bg-white dark:bg-admin-base p-4 shrink-0 hidden md:flex flex-col relative z-10 shadow-sm animate-in fade-in slide-in-from-left duration-500">
      <div className="flex flex-col h-full gap-8">
        <div className="px-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 dark:bg-[#7aa2f7]/10 p-2.5 rounded-lg shadow-sm ring-1 ring-violet-200 dark:ring-[#7aa2f7]/20">
              <ImageIcon
                size={22}
                className="text-violet-600 dark:text-[#7aa2f7]"
              />
            </div>
            <Heading
              as="h5"
              className="tracking-tight text-neutral-800 dark:text-admin-text"
            >
              Gallery Admin
            </Heading>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 grow">
          <Text
            className="px-3 mb-2 text-[10px] uppercase font-bold tracking-[0.15em] text-neutral-400 dark:text-admin-text-dim"
          >
            Menu
          </Text>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/administrator" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-violet-50 dark:bg-[#7aa2f7]/10 text-violet-700 dark:text-[#7aa2f7] font-semibold"
                    : "text-neutral-600 dark:text-admin-text-dim hover:bg-neutral-50 dark:hover:bg-admin-border/50 hover:text-neutral-900 dark:hover:text-admin-text"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-violet-600 dark:bg-[#7aa2f7] rounded-r-full shadow-sm shadow-violet-500/50" />
                )}
                <item.icon
                  size={18}
                  className={`mr-3 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isActive
                      ? "text-violet-600 dark:text-[#7aa2f7]"
                      : "text-neutral-400 dark:text-admin-text-dim group-hover:text-neutral-600 dark:group-hover:text-admin-text-muted"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-neutral-100 dark:border-admin-border">
          <Link
            href="/"
            className="flex items-center px-4 py-3 rounded-lg text-sm font-semibold text-neutral-500 dark:text-admin-text-dim hover:text-neutral-900 dark:hover:text-admin-text hover:bg-neutral-50 dark:hover:bg-admin-border/50 transition-all duration-300"
          >
            <span className="mr-2">←</span> Back to Site
          </Link>
        </div>
      </div>
    </aside>
  );
}
