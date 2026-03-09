"use client";

import { useState } from "react";
import { Heading, Text } from "@/components/ui/Typography";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("My Gallery");
  const [faceSearchEnabled, setFaceSearchEnabled] = useState(true);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
      <div className="mb-10">
        <Heading as="h2" className="mb-2">
          Settings
        </Heading>
        <Text className="text-neutral-500 dark:text-[#a9b1d6]">
          ตั้งค่าระบบทั่วไปและจัดการการแสดงผล
        </Text>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="p-8 rounded-3xl bg-white dark:bg-[#1f2335] shadow-sm border border-neutral-100 dark:border-[#292e42] animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-violet-600 dark:bg-violet-500 rounded-full" />
            <Heading as="h4">การแสดงผล</Heading>
          </div>

          <div className="space-y-8">
            <Input
              label="ชื่อเว็บไซต์"
              placeholder="ระบุชื่อเว็บไซต์"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              helperText="ชื่อที่จะปรากฏในส่วนต่างๆ ของเว็บไซต์"
            />

            <div className="pt-2">
                <Toggle
                    label="เปิดใช้งานค้นหาด้วยใบหน้า"
                    description="อนุญาตให้ผู้เข้าชมอัปโหลดรูปเพื่อค้นหาใบหน้าในงานต่างๆ"
                    checked={faceSearchEnabled}
                    onChange={setFaceSearchEnabled}
                />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-neutral-50 dark:border-[#292e42] flex justify-end">
            <Button
              variant="primary"
              className="px-8"
              onClick={() => alert("Settings saved!")}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </section>

        {/* System Info Section (Optional Placeholder) */}
        <section className="p-8 rounded-3xl bg-white dark:bg-[#1f2335]/50 border border-dashed border-neutral-200 dark:border-[#292e42] opacity-80">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-neutral-300 dark:bg-[#565f89] rounded-full" />
             <Heading as="h5" className="text-neutral-500 dark:text-[#565f89]">ข้อมูลระบบ</Heading>
          </div>
          <Text className="text-sm text-neutral-400 dark:text-[#565f89]">
            เวอร์ชัน 1.0.0 (Build 20240325)
          </Text>
        </section>
      </div>
    </div>
  );
}
