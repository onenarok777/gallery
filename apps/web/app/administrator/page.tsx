"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import { Heading, Text } from "@/components/ui/Typography";

export default function AdminDashboardPage() {
  const [stats] = useState({ events: 0, images: 0 });

  useEffect(() => {
    // In the future this will fetch real stats from the backend
  }, []);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="mb-10">
        <Heading
          as="h2"
          className="mb-2 bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-[#7aa2f7] dark:to-[#bb9af7] inline-block"
        >
          Dashboard Overview
        </Heading>
        <Text className="text-neutral-500 dark:text-[#a9b1d6]">
          ยินดีต้อนรับสู่ระบบจัดการแกลเลอรี สรุปข้อมูลทั้งหมด
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Events Card */}
        <div
          className="relative overflow-hidden group p-8 rounded-3xl bg-white dark:bg-[#1f2335] border border-neutral-200 dark:border-[#292e42] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute -right-6 -top-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500 text-neutral-900 dark:text-[#c0caf5]">
            <CalendarDays size={160} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 dark:text-[#565f89]">
                Total Events
              </span>
              <div className="bg-violet-100 dark:bg-[#7aa2f7]/10 p-2.5 rounded-2xl text-violet-600 dark:text-[#7aa2f7] shadow-sm ring-1 ring-violet-200 dark:ring-[#7aa2f7]/20">
                <CalendarDays size={20} />
              </div>
            </div>
            
            <Heading as="h1" className="text-5xl font-black text-neutral-900 dark:text-[#c0caf5]">
              {stats.events}
            </Heading>
          </div>
        </div>

        {/* Total Images Card */}
        <div
          className="relative overflow-hidden group p-8 rounded-3xl bg-white dark:bg-[#1f2335] border border-neutral-200 dark:border-[#292e42] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute -right-6 -top-6 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500 text-neutral-900 dark:text-[#c0caf5]">
            <ImageIcon size={160} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 dark:text-[#565f89]">
                Total Images (Drive)
              </span>
              <div className="bg-indigo-100 dark:bg-[#bb9af7]/10 p-2.5 rounded-2xl text-indigo-600 dark:text-[#bb9af7] shadow-sm ring-1 ring-indigo-200 dark:ring-[#bb9af7]/20">
                <ImageIcon size={20} />
              </div>
            </div>
            
            <Heading as="h1" className="text-5xl font-black text-neutral-900 dark:text-[#c0caf5]">
              {stats.images > 0 ? stats.images : "N/A"}
            </Heading>
          </div>
        </div>
      </div>
    </div>
  );
}
