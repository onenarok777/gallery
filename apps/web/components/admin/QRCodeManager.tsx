"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { useRef } from "react";
import Button from "../ui/Button";
import { Text } from "../ui/Typography";

export default function QRCodeManager({
  eventId,
  driveLink,
}: {
  eventId: string | null;
  driveLink: string;
}) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 60; // Extra padding
      canvas.height = img.height + 60;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 30, 30);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${eventId || "event"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      className="flex flex-col items-center gap-8 py-10 bg-neutral-50 dark:bg-[#1f2335]/50 rounded-2xl border border-neutral-200/60 dark:border-[#292e42]/50 shadow-sm animate-in fade-in duration-500"
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-xl shadow-violet-500/5 border border-neutral-100 dark:border-none ring-4 ring-neutral-100/50 dark:ring-[#292e42]/30"
        ref={qrRef}
      >
        <QRCodeSVG
          value={driveLink || `event:${eventId}`}
          size={240}
          level="H"
          includeMargin={false}
          className="dark:bg-white p-1"
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-6 text-center max-w-sm">
        <Text
          className="text-lg font-bold text-neutral-900 dark:text-[#c0caf5]"
        >
          ดาวน์โหลด QR Code สำหรับกิจกรรม
        </Text>
        <Text
          className="text-sm text-neutral-500 dark:text-[#a9b1d6] leading-relaxed"
        >
          คุณสามารถบันทึกภาพ QR Code นี้เป็นไฟล์ PNG 
          เพื่อให้ผู้ร่วมงานสแกนเพื่อเข้าถึง Google Drive ได้ทันที
        </Text>
        
        <div className="mt-4 w-full">
          <Button
            onClick={downloadQRCode}
            leftIcon={<Download size={18} />}
            className="w-full"
          >
            บันทึกเป็นรูปภาพ (PNG)
          </Button>
        </div>
      </div>
    </div>
  );
}
