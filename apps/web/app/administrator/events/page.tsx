"use client";

import { Plus, Edit2, QrCode, Trash2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import EventDrawer from "@/components/admin/EventDrawer";
import QRCodeDrawer from "@/components/admin/QRCodeDrawer";
import { Heading, Text } from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import DataTable, { Column } from "@/components/ui/DataTable";
import Dropdown from "@/components/ui/Dropdown";
import { useAlert } from "@/components/ui/AlertContext";

interface Event {
  id: string;
  title: string;
  driveLink: string;
  googleLink?: string;
  googleFolderLink?: string;
  qrLogoUrl?: string | null;
  qrFgColor?: string;
  qrBgColor?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQRDrawerOpen, setIsQRDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const alert = useAlert();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events`,
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const currentData = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: Column<Event>[] = [
    {
      key: "title",
      header: "ชื่องาน",
      headerClassName: "w-auto md:w-[70%]",
      className: "w-auto md:w-[70%]",
      render: (event) => (
        <div className="flex flex-col">
          <Text className="font-bold text-neutral-900 dark:text-[#c0caf5]">
            {event.title}
          </Text>
          {event.googleLink && (
            <a 
              href={event.googleLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-violet-500 hover:underline flex items-center gap-1 w-fit"
            >
              <ExternalLink size={10} /> ดูหน้าแกลเลอรี
            </a>
          )}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "แก้ไขล่าสุด",
      headerClassName: "hidden md:table-cell w-[20%]",
      className: "hidden md:table-cell w-[20%]",
      render: (event) => (
        <Text className="text-sm text-neutral-400 dark:text-[#565f89]">
          {new Date(event.updatedAt).toLocaleDateString("th-TH", {
             year: "numeric",
             month: "short",
             day: "numeric",
             hour: "2-digit",
             minute: "2-digit"
          })}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "จัดการ",
      headerClassName: "w-20 md:w-[10%] text-right",
      className: "w-20 md:w-[10%] text-right",
      render: (event) => (
        <Dropdown
          items={[
            {
              label: "แก้ไขข้อมูล",
              icon: <Edit2 size={16} />,
              onClick: () => {
                setSelectedEvent(event);
                setIsDrawerOpen(true);
              },
            },
            {
              label: "จัดการ QR Code",
              icon: <QrCode size={16} />,
              onClick: () => {
                setSelectedEvent(event);
                setIsQRDrawerOpen(true);
              },
            },
            {
              label: "ลบ Event",
              icon: <Trash2 size={16} />,
              variant: "danger",
              onClick: async () => {
                  const confirmed = await alert.confirm(
                    "ยืนยันการลบ?", 
                    `คุณแน่ใจว่าต้องการลบ "${event.title}" ใช่หรือไม่? ไม่สามารถกู้คืนได้`
                  );
                  if (confirmed) {
                    handleDirectDelete(event.id);
                  }
              },
            },
          ]}
        />
      ),
    },
  ];

  const handleDirectDelete = async (id: string) => {
     try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
          await alert.success("ลบสำเร็จ", "ข้อมูล Event ถูกลบออกจากระบบแล้ว");
          fetchEvents();
        } else {
          const data = await res.json();
          alert.error("ผิดพลาด", data.error || "ไม่สามารถลบข้อมูลได้");
        }
     } catch (e) {
        console.error(e);
        alert.error("ผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
     }
  }

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <Heading as="h2" className="mb-2">
            Events List
          </Heading>
          <Text className="text-neutral-500 dark:text-[#a9b1d6]">
            จัดการข้อมูลกิจกรรมและการเข้าถึงทั้งหมด
          </Text>
        </div>
        <Button
          onClick={() => {
            setSelectedEvent(null);
            setIsDrawerOpen(true);
          }}
          className="shadow-lg shadow-violet-500/20"
        >
          <Plus size={18} className="mr-2" /> สร้าง Event ใหม่
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={currentData}
        isLoading={isLoading}
        emptyMessage="ยังไม่มีการสร้าง Event ใดๆ"
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Main Edit/Create Drawer */}
      <EventDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        eventId={selectedEvent?.id}
        onSuccess={() => {
          setIsDrawerOpen(false);
          fetchEvents();
        }}
      />

      {/* QR Code Customization Drawer */}
      {selectedEvent && (
        <QRCodeDrawer
            key={selectedEvent.id}
            isOpen={isQRDrawerOpen}
            onClose={() => setIsQRDrawerOpen(false)}
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title}
        />
      )}
    </div>
  );
}
