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
    <div className="w-full animate-in fade-in duration-700">
      <div className="mb-10">
        <Heading as="h2" className="mb-2">
          Settings
        </Heading>
        <Text className="text-neutral-500 dark:text-admin-text-muted">
          ตั้งค่าระบบทั่วไปและจัดการการแสดงผล
        </Text>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="p-8 rounded-lg bg-white dark:bg-admin-surface-hover shadow-sm border border-neutral-100 dark:border-admin-border animate-in slide-in-from-bottom-4 duration-500">
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

          <div className="mt-10 pt-8 border-t border-neutral-50 dark:border-admin-border flex justify-end">
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
        <section className="p-8 rounded-3xl bg-white dark:bg-admin-surface-hover/50 border border-dashed border-neutral-200 dark:border-admin-border opacity-80">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-6 bg-neutral-300 dark:bg-admin-text-dim rounded-full" />
             <Heading as="h5" className="text-neutral-500 dark:text-admin-text-dim">ข้อมูลระบบ</Heading>
          </div>
          <Text className="text-sm text-neutral-400 dark:text-admin-text-dim">
            เวอร์ชัน 1.0.0 (Build 20240325)
          </Text>
        </section>
      </div>
    </div>
  );
}
