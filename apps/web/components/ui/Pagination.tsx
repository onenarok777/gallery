"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronDown } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  pageSize,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = safeTotalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(renderPageButton(i));
      }
    } else {
      // Logic for ellipsis
      pages.push(renderPageButton(1));
      
      if (currentPage > 3) {
        pages.push(<MoreHorizontal key="ellipsis-start" size={16} className="text-neutral-300 dark:text-[#292e42]" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(renderPageButton(i));
      }

      if (currentPage < safeTotalPages - 2) {
        pages.push(<MoreHorizontal key="ellipsis-end" size={16} className="text-neutral-300 dark:text-[#292e42]" />);
      }

      pages.push(renderPageButton(safeTotalPages));
    }

    return pages;
  };

  const renderPageButton = (page: number) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      disabled={disabled}
      className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
        currentPage === page
          ? "bg-violet-600 dark:bg-violet-500 text-white shadow-md shadow-violet-500/20"
          : "text-neutral-500 dark:text-[#a9b1d6] hover:bg-neutral-100 dark:hover:bg-[#292e42] hover:text-neutral-900 dark:hover:text-white"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {page}
    </button>
  );

  return (
    <div className={`flex flex-row items-center justify-between sm:justify-end w-full gap-4 sm:gap-6 ${className}`}>
      <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap justify-center overflow-x-auto hide-scrollbar">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || disabled}
          className="p-2 rounded-lg text-neutral-500 dark:text-[#a9b1d6] hover:bg-neutral-100 dark:hover:bg-[#292e42] hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1">
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages || disabled}
          className="p-2 rounded-lg text-neutral-500 dark:text-[#a9b1d6] hover:bg-neutral-100 dark:hover:bg-[#292e42] hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {onPageSizeChange && pageSize && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-[#a9b1d6]">
          <span className="hidden sm:inline-block">แสดงหน้าละ</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
              disabled={disabled}
              className={`h-9 px-3 flex items-center gap-2 rounded-lg border text-sm font-medium transition-all ${
                isDropdownOpen
                  ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "border-neutral-200 dark:border-[#292e42] bg-white dark:bg-[#1f2335] text-neutral-700 dark:text-[#c0caf5] hover:border-violet-300 dark:hover:border-violet-500/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {pageSize}
              <ChevronDown
                size={14}
                className={`text-neutral-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-violet-500" : ""
                }`}
              />
            </button>

            {isDropdownOpen && !disabled && (
              <div className="absolute right-0 top-full mt-1.5 w-full min-w-[80px] z-50 py-1.5 rounded-lg border border-neutral-100 dark:border-[#292e42] bg-white dark:bg-[#1f2335] shadow-lg shadow-neutral-200/20 dark:shadow-none translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[200px] overflow-y-auto">
                  {pageSizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onPageSizeChange(size);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                        pageSize === size
                          ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                          : "text-neutral-600 dark:text-[#a9b1d6] hover:bg-neutral-50 dark:hover:bg-[#292e42] hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
