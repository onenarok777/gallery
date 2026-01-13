"use client";

import { useEffect, useRef } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onDownload: () => void;
  imageName: string;
}

export default function CustomContextMenu({
  x,
  y,
  visible,
  onClose,
  onDownload,
  imageName,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Close on scroll
    const handleScroll = () => {
        onClose();
    }

    if (visible) {
      document.addEventListener("click", handleClick);
      window.addEventListener("scroll", handleScroll);
      document.addEventListener("contextmenu", (e) => {
          if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
             onClose(); // Close if right clicking elsewhere
          }
      });
    }

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white/90 dark:bg-black/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-500 truncate max-w-[180px]">
              {imageName}
          </p>
      </div>
      <div className="p-1">
        <button
          onClick={() => {
            onDownload();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Original
        </button>
        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
         <div className="px-3 py-1.5 text-[10px] text-neutral-400 text-center uppercase tracking-wider">
             ForMe Gallery
         </div>
      </div>
    </div>
  );
}
