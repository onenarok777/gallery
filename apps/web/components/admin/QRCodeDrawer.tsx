"use client";

import { X, Download, Save, Palette, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import Button from "../ui/Button";
import { Heading, Text } from "../ui/Typography";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  eventTitle: string;
}

export default function QRCodeDrawer({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: QRCodeDrawerProps) {
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [includeImage, setIncludeImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1024, 1024);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${eventTitle}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save QR preferences
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  // The link that the QR code points to
  const eventLink = `${window.location.origin}/event/${eventId}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-100 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed z-101 top-0 bottom-0 left-0 right-0 h-screen md:left-auto md:right-0 md:w-full md:max-w-xl bg-white dark:bg-[#1a1b26] border-l border-neutral-200 dark:border-[#292e42] shadow-2xl transition-all animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-[#292e42] flex items-center justify-between shrink-0">
          <div>
            <Heading as="h5">จัดการ QR Code</Heading>
            <Text className="text-xs text-neutral-500 dark:text-[#565f89]">{eventTitle}</Text>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-[#1f2335] rounded-full transition-colors text-neutral-400 dark:text-[#565f89]">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="grow overflow-y-auto p-8 space-y-10">
          {/* QR Preview Section */}
          <div className="flex flex-col items-center">
            <div className="p-8 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 ring-1 ring-neutral-100 dark:ring-white/5 animate-in zoom-in duration-700">
               <QRCodeSVG
                value={eventLink}
                size={240}
                level="H"
                includeMargin={false}
                imageSettings={includeImage ? {
                    src: "/logo.png", // This would be the project logo
                    x: undefined,
                    y: undefined,
                    height: 50,
                    width: 50,
                    excavate: true,
                } : undefined}
                fgColor={fgColor}
                bgColor={bgColor}
                ref={qrRef}
              />
            </div>
            <div className="mt-8 flex flex-col items-center">
               <Text className="text-sm font-bold text-neutral-900 dark:text-[#c0caf5] mb-1">สแกนเพื่อเข้าสู่หน้างาน</Text>
               <Text className="text-xs text-neutral-400 dark:text-[#565f89] break-all text-center max-w-[280px]">
                 {eventLink}
               </Text>
            </div>
            
            <Button variant="soft" className="mt-6" onClick={downloadQRCode}>
                <Download size={16} className="mr-2" /> ดาวน์โหลดไฟล์ PNG
            </Button>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-[#292e42]" />

          {/* Customization Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-violet-600 dark:text-[#7aa2f7]">
                <Palette size={18} />
                <Text className="font-bold text-sm">การตกแต่ง</Text>
            </div>

            <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Text className="text-xs font-bold text-neutral-500 dark:text-[#565f89]">สีของรหัส (Foreground)</Text>
                    <div className="flex items-center gap-3 p-2 rounded-2xl border border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1f2335]">
                        <input 
                            type="color" 
                            value={fgColor} 
                            onChange={(e) => setFgColor(e.target.value)}
                            className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <Text className="text-sm font-mono uppercase">{fgColor}</Text>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Text className="text-xs font-bold text-neutral-500 dark:text-[#565f89]">สีพื้นหลัง (Background)</Text>
                    <div className="flex items-center gap-3 p-2 rounded-2xl border border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1f2335]">
                        <input 
                            type="color" 
                            value={bgColor} 
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <Text className="text-sm font-mono uppercase">{bgColor}</Text>
                    </div>
                 </div>
            </div>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1f2335] cursor-pointer group transition-all hover:bg-neutral-100 dark:hover:bg-[#1f2335]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#24283b] flex items-center justify-center shadow-sm text-violet-600 dark:text-[#7aa2f7]">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <Text className="text-sm font-bold text-neutral-900 dark:text-[#c0caf5]">ใส่โลโก้ตรงกลาง</Text>
                        <Text className="text-[10px] text-neutral-400 dark:text-[#565f89]">แสดงโลโก้ธุรกิจของคุณที่จุดศูนย์กลาง</Text>
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    checked={includeImage}
                    onChange={(e) => setIncludeImage(e.target.checked)}
                    className="w-5 h-5 accent-violet-600 rounded-lg cursor-pointer"
                />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1a1b26] shrink-0 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            <Save size={16} className="mr-2" /> บันทึกการเปลี่ยนแปลง
          </Button>
        </div>
      </div>
    </>
  );
}
