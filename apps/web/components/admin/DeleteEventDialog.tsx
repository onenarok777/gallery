"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { Heading, Text } from "../ui/Typography";

export default function DeleteEventDialog({
  eventId,
  eventTitle,
  onDeleteSuccess,
}: {
  eventId: string;
  eventTitle: string;
  onDeleteSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${eventId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setIsOpen(false);
        onDeleteSuccess();
      } else {
        alert("Failed to delete event");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setIsOpen(true)}
        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-95 px-3 py-1.5"
      >
        <Trash2 size={16} className="mr-2" /> ลบ
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setIsOpen(false)}
          />

          {/* Dialog Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-[#1a1b26] rounded-3xl shadow-2xl border border-neutral-100 dark:border-[#292e42] p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center mb-6 ring-4 ring-red-50 dark:ring-red-900/5">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              
              <Heading as="h4" className="mb-2">ลบข้อมูล Event</Heading>
              
              <div className="space-y-3 mb-8">
                <Text className="text-sm">
                  คุณแน่ใจหรือไม่ว่าต้องการลบงาน <span className="font-bold text-neutral-900 dark:text-[#c0caf5]">&quot;{eventTitle}&quot;</span>?
                </Text>
                <div className="p-3 bg-neutral-50 dark:bg-[#1f2335] rounded-xl border border-neutral-100 dark:border-[#292e42]">
                    <Text className="text-xs font-semibold text-red-500/80">
                        * การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบออกถาวร
                    </Text>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                >
                  ยกเลิก
                </Button>
                <Button 
                  variant="error" 
                  className="flex-1"
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  ยืนยันการลบ
                </Button>
              </div>
            </div>

            <button
               onClick={() => !isDeleting && setIsOpen(false)}
               className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#a9b1d6] transition-colors"
            >
                <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
