import { X } from "lucide-react";
import EventForm from "./EventForm";
import { useEffect, useState, useRef } from "react";
import Button from "../ui/Button";
import { Heading, Text } from "../ui/Typography";

interface EventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
  onSuccess: () => void;
}

interface EventData {
  title: string;
  googleLink?: string;
  googleFolderLink?: string;
  driveLink: string;
  isFaceSearchEnabled?: boolean;
  isPaginationEnabled?: boolean;
}

export default function EventDrawer({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: EventDrawerProps) {
  const [initialData, setInitialData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const isEditMode = !!eventId;

  useEffect(() => {
    if (isOpen && isEditMode) {
      const fetchEvent = async () => {
        setIsLoading(true);
        setError("");
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${eventId}`,
          );
          if (!res.ok) throw new Error("Event not found");
          const data = await res.json();
          setInitialData(data.data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvent();
      setInitialData(null);
      setError("");
    }
  }, [isOpen, eventId, isEditMode]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
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

  if (!isOpen) return null;

  const handleSave = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-60 transition-opacity animate-in fade-in duration-300"
      />

      {/* Responsive Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-[#1a1b26] shadow-2xl z-[70] overflow-y-auto animate-in slide-in-from-right duration-500 rounded-l-lg border-l border-neutral-100 dark:border-[#292e42]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-[#292e42] flex items-center justify-between shrink-0">
          <div>
            <Heading as="h5" className="text-neutral-900 dark:text-[#c0caf5]">
              {isEditMode ? "แก้ไข Event" : "เพิ่ม Event ใหม่"}
            </Heading>
            {isEditMode && eventId ? (
              <div className="flex items-center gap-2 mt-1">
                <Text className="text-xs text-neutral-500 dark:text-[#565f89] uppercase tracking-wider font-semibold">Event ID:</Text>
                <Text className="text-xs font-mono text-neutral-600 dark:text-[#a9b1d6]">{eventId}</Text>
              </div>
            ) : (
              <Text className="text-xs text-neutral-500 dark:text-[#565f89] mt-1">ระบุรายละเอียดกิจกรรมและลิงก์เชื่อมโยง</Text>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-[#1f2335] rounded-full transition-colors text-neutral-400 dark:text-[#565f89]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="grow overflow-y-auto p-6 pb-12">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-[#f7768e] p-4 rounded-lg border border-red-200 dark:border-red-900/30 text-sm">
              พบข้อผิดพลาด: {error}
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
               <div className="w-full h-8 bg-neutral-100 dark:bg-[#1f2335]/50 animate-pulse rounded-lg" />
               <div className="w-full h-32 bg-neutral-100 dark:bg-[#1f2335]/50 animate-pulse rounded-lg" />
               <div className="w-full h-32 bg-neutral-100 dark:bg-[#1f2335]/50 animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {isEditMode && initialData && (
                <div className="w-full">
                  {/* Form */}
                  <EventForm
                    initialData={initialData}
                    eventId={eventId}
                    onSuccess={onSuccess}
                    onFormRef={(ref) => (formRef.current = ref)}
                    onSubmittingChange={setIsSubmitting}
                  />
                </div>
              )}
              {!isEditMode && (
                <EventForm
                  onSuccess={onSuccess}
                  onFormRef={(ref) => (formRef.current = ref)}
                  onSubmittingChange={setIsSubmitting}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1a1b26] shrink-0 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            loading={isSubmitting}
          >
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </>
  );
}
