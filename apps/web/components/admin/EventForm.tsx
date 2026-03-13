"use client";

import { useState } from "react";
import Input from "../ui/Input";
import Switch from "../ui/Switch";
import { useAlert } from "../ui/AlertContext";

interface EventFormData {
  title: string;
  googleFolderLink: string;
  isFaceSearchEnabled: boolean;
  isPaginationEnabled: boolean;
}

export default function EventForm({
  initialData,
  eventId,
  onSuccess,
  onFormRef,
  onSubmittingChange,
}: {
  initialData?: {
    title: string;
    googleLink?: string;
    googleFolderLink?: string;
    driveLink?: string;
    isFaceSearchEnabled?: boolean;
    isPaginationEnabled?: boolean;
  };
  eventId?: string;
  onSuccess?: () => void;
  onFormRef?: (ref: HTMLFormElement | null) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    googleFolderLink: initialData?.googleFolderLink || initialData?.driveLink || "",
    isFaceSearchEnabled: initialData?.isFaceSearchEnabled ?? true,
    isPaginationEnabled: initialData?.isPaginationEnabled ?? false,
  });
  const [error, setError] = useState("");
  const alert = useAlert();

  const isEditMode = !!eventId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = await alert.confirm(
      isEditMode ? "ยืนยันการแก้ไข?" : "ยืนยันการสร้าง?",
      isEditMode 
        ? `คุณต้องการบันทึกการเปลี่ยนแปลงของ "${formData.title}" ใช่หรือไม่?`
        : `คุณต้องการสร้าง Event "${formData.title}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    if (onSubmittingChange) onSubmittingChange(true);
    setError("");

    try {
      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${eventId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events`;

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save event");
      }

      if (onSuccess) {
        await alert.success(
          isEditMode ? "แก้ไขสำเร็จ" : "สร้างสำเร็จ",
          `Event "${formData.title}" ถูกบันทึกเรียบร้อยแล้ว`
        );
        onSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={onFormRef} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-[#f7768e] rounded-lg border border-red-200 dark:border-red-900/30 text-sm font-medium animate-in fade-in zoom-in duration-200">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <Input
          label="ชื่องาน (Title)"
          placeholder="เช่น งานแต่งงานคุณ A & B"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          autoComplete="off"
        />

        <Input
          label="Google Folder Link"
          placeholder="https://drive.google.com/drive/folders/..."
          value={formData.googleFolderLink}
          onChange={(e) => setFormData({ ...formData, googleFolderLink: e.target.value })}
          required
          helperText="วางลิงก์โฟลเดอร์ Google Drive ที่เปิดสิทธิ์แชร์แล้ว"
        />

        <div className="pt-4 border-t border-neutral-100 dark:border-[#292e42] space-y-5">
          <Switch
            checked={formData.isFaceSearchEnabled}
            onChange={(checked) => setFormData({ ...formData, isFaceSearchEnabled: checked })}
            label="ระบบค้นหาด้วยใบหน้า"
            description="เปิดใช้งานระบบค้นหารูปภาพด้วยใบหน้า (Face Search) จาก AI"
          />

          <Switch
            checked={formData.isPaginationEnabled}
            onChange={(checked) => setFormData({ ...formData, isPaginationEnabled: checked })}
            label="รูปแบบการแสดงภาพ (Pagination)"
            description="หากปิดจะเป็นการเลื่อนหน้าจออัตโนมัติ (Infinite Scroll / Lazy Load) หากเปิดจะเป็นการแบ่งหน้า"
          />
        </div>
      </div>

      <button type="submit" className="hidden" />
    </form>
  );
}
