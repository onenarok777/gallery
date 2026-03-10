"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { Noto_Sans_Thai } from "next/font/google";
import { AlertProvider } from "@/components/ui/AlertContext";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className={`${notoSansThai.variable} ${notoSansThai.className} min-h-screen bg-neutral-50 dark:bg-[#1a1b26] text-neutral-900 dark:text-[#c0caf5] selection:bg-violet-500/30`}
      style={{ fontFamily: "var(--font-noto-sans-thai)" }}
    >
      <AlertProvider>
        <div className="flex flex-col md:flex-row min-h-screen overflow-hidden">
          <AdminSidebar />
          <main
            className="flex-1 p-4 overflow-y-auto h-screen pb-24 md:pb-12"
          >
            {children}
          </main>
          <AdminBottomNav />
        </div>
      </AlertProvider>
    </div>
  );
}
