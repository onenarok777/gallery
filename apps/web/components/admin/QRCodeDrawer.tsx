import { X, Download, Save, Palette, Image as ImageIcon, Upload, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import { Heading, Text } from "../ui/Typography";
import { QRCodeSVG } from "qrcode.react";
import { useAlert } from "../ui/AlertContext";

interface QRCodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  eventTitle: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function QRCodeDrawer({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: QRCodeDrawerProps) {
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrMargin, setQrMargin] = useState(2);

  // URL ที่บันทึกใน DB (จาก R2)
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  // File ที่ user เลือกใหม่ (ยังไม่ได้ upload)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Local object URL สำหรับ preview ก่อน upload
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [includeImage, setIncludeImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const alert = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // URL ที่ใช้แสดงใน QR preview (ถ้ามี pending ใช้ local, ไม่งั้นใช้ saved)
  const qrLogoUrl = localPreviewUrl ?? savedLogoUrl;

  // ── Fetch existing preferences ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen && eventId) {
      const fetchPrefs = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_URL}/api/events/${eventId}`);
          if (res.ok) {
            const data = await res.json();
            const event = data.data;
            if (event && event.qrSettings) {
              setFgColor(event.qrSettings.fgColor || "#000000");
              setBgColor(event.qrSettings.bgColor || "#ffffff");
              setSavedLogoUrl(event.qrSettings.logoUrl || null);
              setIncludeImage(!!event.qrSettings.logoUrl);
            } else if (event) {
              setFgColor("#000000");
              setBgColor("#ffffff");
              setSavedLogoUrl(null);
              setIncludeImage(false);
            }
          }
        } catch (e) {
          console.error("Failed to fetch QR preferences:", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPrefs();
    }
  }, [isOpen, eventId, API_URL]);

  // Cleanup local object URL เมื่อ drawer ปิด หรือเมื่อเปลี่ยนไฟล์
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  // Reset pending state เมื่อ drawer ปิด
  useEffect(() => {
    if (!isOpen) {
      setPendingFile(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
    }
  }, [isOpen, localPreviewUrl]);

  // ── เลือกไฟล์ → แค่ preview, ยังไม่ upload ──────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert.error("ไฟล์มีขนาดใหญ่เกินไป", "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Revoke URL เก่าก่อนสร้างใหม่
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setLocalPreviewUrl(objectUrl);
    setIncludeImage(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Download QR ──────────────────────────────────────────────────────────
  const downloadQRCode = async () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    // Remove embedded image from SVG string to ensure safe parsing
    const safeSvgData = svgData.replace(/<image[^>]*><\/image>|<image[^>]*\/>/g, "");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate total canvas size including margin
    const qrContentSize = 1024;
    const marginPx = Math.round((qrMargin / 240) * qrContentSize);
    const totalSize = qrContentSize + marginPx * 2;
    canvas.width = totalSize;
    canvas.height = totalSize;

    const img = new Image();
    
    const svgPromise = new Promise((resolve) => {
      img.onload = () => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, totalSize, totalSize);
        ctx.drawImage(img, marginPx, marginPx, qrContentSize, qrContentSize);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.crossOrigin = "anonymous";
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(safeSvgData)));
    });

    await svgPromise;

    if (includeImage && qrLogoUrl) {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      
      const logoPromise = new Promise((resolve) => {
        logoImg.onload = () => resolve(true);
        logoImg.onerror = () => resolve(false);
        logoImg.src = qrLogoUrl;
      });

      const loaded = await logoPromise;
      if (loaded) {
        // qrcode.react settings: size 240, logo size 50. 
        // We map these to the 1024px canvas scale, offset by margin.
        const logoSize = (50 / 240) * qrContentSize; 
        const offset = marginPx + (qrContentSize - logoSize) / 2;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(offset, offset, logoSize, logoSize);
        ctx.drawImage(logoImg, offset, offset, logoSize, logoSize);
      }
    }

    try {
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${eventTitle}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    } catch (err) {
      console.error("Failed to export canvas", err);
      alert.error("ดาวน์โหลดไม่สำเร็จ", "มีปัญหาการสร้างรูปภาพจากเซิร์ฟเวอร์ (CORS)");
    }
  };

  // ── Save: ใช้ FormData ส่งไปยัง /api/qr-code/:eventId ────────────────────
  const handleSave = async () => {
    // 1. Alert Confirm
    const confirmed = await alert.confirm("คุณต้องการบันทึกการเปลี่ยนแปลง QR Code หรือไม่?");
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("fgColor", fgColor);
      formData.append("bgColor", bgColor);
      formData.append("includeLogo", String(includeImage));

      if (pendingFile) {
        formData.append("logoFile", pendingFile);
      }

      // ส่งไปยัง API ใหม่
      const res = await fetch(`${API_URL}/api/qr-code/${eventId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const updatedSettings = result.data;

        // Update local state
        setSavedLogoUrl(updatedSettings.logoUrl);
        setFgColor(updatedSettings.fgColor);
        setBgColor(updatedSettings.bgColor);

        // Cleanup
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
        setPendingFile(null);

        alert.success("บันทึกสำเร็จ", "การตั้งค่า QR Code ถูกบันทึกเรียบร้อยแล้ว");
        onClose();
      } else {
        const data = await res.json();
        alert.error("บันทึกไม่สำเร็จ", data.error || "เกิดข้อผิดพลาดบางอย่าง");
      }
    } catch (e: unknown) {
      console.error(e);
      alert.error("ผิดพลาด", (e as Error).message || "ไม่สามารถบันทึกได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const eventLink = `${window.location.origin}/event/${eventId}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[60] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed z-[70] top-0 bottom-0 left-0 right-0 h-screen md:left-auto md:right-0 md:w-full md:max-w-xl bg-white dark:bg-[#1a1b26] border-l border-neutral-200 dark:border-[#292e42] shadow-2xl transition-all animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
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
        <div className="grow overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
               <Loader2 size={32} className="animate-spin text-violet-500" />
               <Text className="text-sm text-neutral-400">กำลังโหลดข้อมูล...</Text>
            </div>
          ) : (
            <>
              {/* QR Preview Section */}
              <div className="flex flex-col items-center">
                <div className="animate-in zoom-in duration-700">
                   <QRCodeSVG
                    value={eventLink}
                    size={240}
                    level="H"
                    includeMargin={false}
                    marginSize={qrMargin}
                    imageSettings={includeImage && qrLogoUrl ? {
                        src: qrLogoUrl,
                        x: undefined,
                        y: undefined,
                        height: 50,
                        width: 50,
                        excavate: true,
                        crossOrigin: "anonymous"
                    } : undefined}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    ref={qrRef}
                  />
                </div>
                <div className="mt-8 flex flex-col items-center text-center px-4">
                   <Text className="text-sm font-bold text-neutral-900 dark:text-[#c0caf5] mb-1">สแกนเพื่อเข้าสู่หน้างาน</Text>
                   <Text className="text-xs text-neutral-400 dark:text-[#565f89] break-all max-w-[320px]">
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
                        <div className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1f2335]">
                            <input
                                type="color"
                                value={fgColor}
                                onChange={(e) => setFgColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                            <Text className="text-sm font-mono uppercase">{fgColor}</Text>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Text className="text-xs font-bold text-neutral-500 dark:text-[#565f89]">สีพื้นหลัง (Background)</Text>
                        <div className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1f2335]">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                            <Text className="text-sm font-mono uppercase">{bgColor}</Text>
                        </div>
                     </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Text className="text-xs font-bold text-neutral-500 dark:text-[#565f89]">ระยะขอบ (Margin)</Text>
                     <Text className="text-xs font-mono text-neutral-400 dark:text-[#565f89]">{qrMargin}px</Text>
                   </div>
                   <input
                     type="range"
                     min={0}
                     max={40}
                     step={1}
                     value={qrMargin}
                     onChange={(e) => setQrMargin(Number(e.target.value))}
                     className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-600 bg-neutral-200 dark:bg-[#292e42]"
                   />
                   <div className="flex justify-between text-[10px] text-neutral-400 dark:text-[#565f89]">
                     <span>ไม่มีขอบ</span>
                     <span>กว้าง</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#24283b] flex items-center justify-center shadow-sm text-violet-600 dark:text-[#7aa2f7]">
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
                            disabled={!qrLogoUrl}
                            onChange={(e) => setIncludeImage(e.target.checked)}
                            className="w-5 h-5 accent-violet-600 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                   </div>

                   <div
                      className="relative p-6 rounded-lg border-2 border-dashed border-neutral-200 dark:border-[#292e42] hover:border-violet-400 dark:hover:border-violet-500 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                   >
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*"
                     />

                     {qrLogoUrl ? (
                        <div className="flex flex-col items-center gap-2">
                           <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-4 ring-violet-500/10 mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qrLogoUrl}
                                alt="Logo preview"
                                className="w-full h-full object-contain bg-white"
                              />
                              {/* Badge แสดงว่ายังไม่ได้ save */}
                              {pendingFile && (
                                <span className="absolute top-0 right-0 bg-amber-400 text-white text-[8px] font-bold px-1 py-0.5 rounded-bl-lg leading-none">
                                  ใหม่
                                </span>
                              )}
                           </div>
                           <div className="flex gap-2">
                             <Button size="sm" variant="soft" className="h-8 text-[10px] px-3" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                <Upload size={12} className="mr-1" /> เปลี่ยนรูปใหม่
                             </Button>
                           </div>
                            {pendingFile && (
                              <Text className="text-[10px] text-amber-500 dark:text-amber-400 text-center">
                                กด &quot;บันทึก&quot; เพื่ออัปโหลดและบันทึกโลโก้
                              </Text>
                            )}
                        </div>
                     ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                            <Upload size={18} />
                          </div>
                          <div className="text-center">
                            <Text className="text-xs font-bold text-neutral-900 dark:text-[#c0caf5]">คลิกเพื่อเพิ่มโลโก้</Text>
                            <Text className="text-[10px] text-neutral-400 dark:text-[#565f89]">PNG, JPG, SVG ขนาดไม่เกิน 5MB</Text>
                          </div>
                        </>
                     )}
                   </div>
                </div>

                {!qrLogoUrl && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex gap-3 border border-amber-100 dark:border-amber-500/20">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <Text className="text-[10px] text-amber-600 dark:text-amber-400">
                      คุณยังไม่ได้เลือกโลโก้ กรุณาอัปโหลดไฟล์ก่อนเพื่อเปิดใช้งาน &quot;ใส่โลโก้ตรงกลาง&quot;
                    </Text>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-[#292e42] bg-neutral-50/50 dark:bg-[#1a1b26] shrink-0 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="secondary" onClick={() => {
            setFgColor("#000000");
            setBgColor("#ffffff");
            setQrMargin(2);
            setIncludeImage(false);
            setPendingFile(null);
            if (localPreviewUrl) {
              URL.revokeObjectURL(localPreviewUrl);
              setLocalPreviewUrl(null);
            }
          }}>
            <RotateCcw size={16} className="mr-2" /> รีเซ็ต
          </Button>
          <Button onClick={handleSave} loading={isSaving} disabled={isLoading}>
            <Save size={16} className="mr-2" />
            {isSaving
              ? pendingFile
                ? "กำลังอัปโหลด..."
                : "กำลังบันทึก..."
              : "บันทึก"}
          </Button>
        </div>
      </div>
    </>
  );
}
