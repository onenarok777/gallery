"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  drive_image_id: string;
  image_name: string;
  score: number;
  imageSrc: string;
  face_bbox?: { x: number; y: number; w: number; h: number };
}

interface FaceSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick?: (imageSrc: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function FaceSearch({
  isOpen,
  onClose,
  onResultClick,
}: FaceSearchProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.55);
  const [dragOver, setDragOver] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // File Handling
  // --------------------------------------------------------------------------

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResults([]);
    setHasSearched(false);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  const handleSearch = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("threshold", threshold.toString());
      formData.append("limit", "30");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/face-search`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "การค้นหาล้มเหลว");
      }

      const data = await response.json();

      if (data.data?.query_faces_count === 0) {
        setError("ไม่พบใบหน้าในรูปที่อัพโหลด กรุณาลองรูปอื่น");
      } else if (!data.data?.results || data.data.results.length === 0) {
        setError("ไม่พบรูปที่ตรงกัน ลองลด threshold ดู");
      }

      setResults(data.data?.results || []);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [selectedFile, threshold]);

  // --------------------------------------------------------------------------
  // Reset & Close
  // --------------------------------------------------------------------------

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults([]);
    setError(null);
    setHasSearched(false);
    onClose();
  }, [onClose]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-[5vh]">
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  ค้นหาด้วยใบหน้า
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  อัพโหลดรูปเพื่อค้นหารูปที่มีใบหน้าเดียวกัน
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Upload Zone */}
            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
                  transition-all duration-200
                  ${dragOver
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border-neutral-300 dark:border-neutral-700 hover:border-violet-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      ลากรูปมาวางที่นี่ หรือ <span className="text-violet-500">คลิกเพื่อเลือก</span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      รองรับ JPG, PNG, WebP (สูงสุด 10MB)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* Preview */
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-violet-500 shrink-0">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setResults([]);
                      setHasSearched(false);
                      setError(null);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {/* Threshold slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        ความแม่นยำขั้นต่ำ
                      </label>
                      <span className="text-xs font-mono text-violet-500">
                        {Math.round(threshold * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => setThreshold(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                      <span>กว้าง</span>
                      <span>แคบ</span>
                    </div>
                  </div>

                  {/* Search button */}
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className={`
                      w-full py-2.5 px-4 rounded-lg font-medium text-sm
                      transition-all duration-200 flex items-center justify-center gap-2
                      ${loading
                        ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        : "bg-linear-to-r from-violet-500 to-pink-500 text-white hover:from-violet-600 hover:to-pink-600 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        กำลังค้นหา...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        ค้นหา
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Results */}
            {hasSearched && results.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    ผลลัพธ์
                  </h3>
                  <span className="text-xs text-neutral-400">
                    พบ {results.length} รูป
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {results.map((result) => (
                    <div
                      key={result.drive_image_id}
                      onClick={() => onResultClick?.(result.imageSrc)}
                      className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-violet-500 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Image
                        src={result.imageSrc}
                        alt={result.image_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 25vw"
                        loading="lazy"
                      />
                      {/* Score badge */}
                      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent p-1.5">
                        <div className="flex items-center justify-end">
                          <span
                            className={`
                              text-[10px] font-bold px-1.5 py-0.5 rounded-full
                              ${result.score >= 0.8
                                ? "bg-green-500/90 text-white"
                                : result.score >= 0.65
                                  ? "bg-yellow-500/90 text-white"
                                  : "bg-neutral-500/90 text-white"
                              }
                            `}
                          >
                            {Math.round(result.score * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 transition-colors flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {hasSearched && results.length === 0 && !error && !loading && (
              <div className="mt-5 text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  ไม่พบรูปที่ตรงกัน
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
