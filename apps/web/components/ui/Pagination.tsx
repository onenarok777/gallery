"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPageButton(i));
      }
    } else {
      // Logic for ellipsis
      pages.push(renderPageButton(1));
      
      if (currentPage > 3) {
        pages.push(<MoreHorizontal key="ellipsis-start" size={16} className="text-neutral-300 dark:text-[#292e42]" />);
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(renderPageButton(i));
      }

      if (currentPage < totalPages - 2) {
        pages.push(<MoreHorizontal key="ellipsis-end" size={16} className="text-neutral-300 dark:text-[#292e42]" />);
      }

      pages.push(renderPageButton(totalPages));
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
    <div className="flex items-center gap-1.5">
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
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || disabled}
        className="p-2 rounded-lg text-neutral-500 dark:text-[#a9b1d6] hover:bg-neutral-100 dark:hover:bg-[#292e42] hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
