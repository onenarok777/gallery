"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface DropdownProps {
  trigger?: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const menu = (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: `${coords.top + 8}px`,
        left: align === "right" 
          ? `${coords.left + coords.width - 192}px` 
          : `${coords.left}px`,
      }}
      className="z-9999 w-48 origin-top-right rounded-2xl bg-white dark:bg-[#1a1b26] shadow-2xl ring-1 ring-black/5 dark:ring-[#292e42] focus:outline-hidden animate-in zoom-in-95 fade-in duration-200"
    >
      <div className="p-1.5 space-y-0.5">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
              item.variant === "danger"
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-neutral-700 dark:text-[#c0caf5] hover:bg-neutral-50 dark:hover:bg-[#1f2335]"
            }`}
          >
            {item.icon && <span className="opacity-70">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="inline-block text-left" ref={triggerRef}>
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger || (
          <button className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#1f2335] text-neutral-400 dark:text-[#565f89] transition-all cursor-pointer">
            <MoreVertical size={18} />
          </button>
        )}
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
