"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { Noto_Sans_Thai } from "next/font/google";
import { AlertProvider } from "@/components/ui/AlertContext";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${notoSansThai.variable} ${notoSansThai.className} min-h-screen bg-neutral-50 dark:bg-admin-surface text-neutral-900 dark:text-admin-text selection:bg-violet-500/30`}
      style={{ fontFamily: "var(--font-noto-sans-thai)" }}
    >
      <AlertProvider>
        <div className="flex flex-col md:flex-row min-h-screen overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto h-screen relative bg-neutral-50 dark:bg-admin-surface">
            <AdminNavbar />
            <div className="p-4 pb-24 md:pb-12">
              {children}
            </div>
          </main>
          <AdminBottomNav />
        </div>
      </AlertProvider>
    </div>
  );
}
