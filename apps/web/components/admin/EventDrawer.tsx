import { X } from "lucide-react";
import EventForm from "./EventForm";
import QRCodeManager from "./QRCodeManager";
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
  const [activeTab, setActiveTab] = useState<"details" | "qrcode">("details");
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
    } else {
      setInitialData(null);
      setError("");
      setActiveTab("details");
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
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-100 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Responsive Panel */}
      <div className="fixed z-101 
        /* Mobile: Full Screen Sheet */
        top-0 bottom-0 left-0 right-0 h-screen
        /* Desktop: Full Height Side Drawer */
        md:top-0 md:bottom-0 md:left-auto md:right-0 md:h-screen md:w-full md:max-w-xl md:rounded-none
        bg-white dark:bg-[#1a1b26] border-t md:border-t-0 md:border-l border-neutral-200 dark:border-[#292e42] shadow-2xl 
        transition-all animate-in slide-in-from-bottom md:slide-in-from-right duration-500 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-[#292e42] flex items-center justify-between shrink-0">
          <div>
            <Heading as="h5" className="text-neutral-900 dark:text-[#c0caf5]">
              {isEditMode ? "แก้ไข Event" : "เพิ่ม Event ใหม่"}
            </Heading>
            <Text className="text-xs text-neutral-500 dark:text-[#565f89]">ระบุรายละเอียดกิจกรรมและลิงก์เชื่อมโยง</Text>
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
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-[#f7768e] p-4 rounded-xl border border-red-200 dark:border-red-900/30 text-sm">
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
                  {/* Custom Tab List */}
                  <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-[#292e42]">
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                        activeTab === "details"
                          ? "text-violet-600 dark:text-[#7aa2f7] border-violet-600 dark:border-[#7aa2f7]"
                          : "text-neutral-500 dark:text-[#565f89] border-transparent hover:text-neutral-700 dark:hover:text-[#a9b1d6]"
                      }`}
                    >
                      ข้อมูลทั่วไป
                    </button>
                    <button
                      onClick={() => setActiveTab("qrcode")}
                      className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                        activeTab === "qrcode"
                          ? "text-violet-600 dark:text-[#7aa2f7] border-violet-600 dark:border-[#7aa2f7]"
                          : "text-neutral-500 dark:text-[#565f89] border-transparent hover:text-neutral-700 dark:hover:text-[#a9b1d6]"
                      }`}
                    >
                      QR Code
                    </button>
                  </div>

                  {activeTab === "details" ? (
                    <EventForm
                      initialData={initialData}
                      eventId={eventId}
                      onSuccess={onSuccess}
                      onFormRef={(ref) => (formRef.current = ref)}
                      onSubmittingChange={setIsSubmitting}
                    />
                  ) : (
                    <QRCodeManager
                      eventId={eventId}
                      driveLink={initialData.driveLink}
                    />
                  )}
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
