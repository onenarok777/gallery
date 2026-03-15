"use client";

import React from "react";
import { Text } from "./Typography";
import Pagination from "./Pagination";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  showHeader?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    total?: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
  };
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "ไม่พบข้อมูล",
  showHeader = true,
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-neutral-100 dark:border-admin-border bg-white dark:bg-admin-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {showHeader && (
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-admin-surface-hover/50 border-b border-neutral-100 dark:border-admin-border">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-admin-text-dim ${column.headerClassName || ""}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-50 dark:divide-admin-border/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-in fade-in duration-500">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4">
                        <div className="h-4 bg-neutral-100 dark:bg-admin-surface-hover rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                       <Text className="text-sm font-medium text-neutral-400 dark:text-admin-text-dim">
                        {emptyMessage}
                      </Text>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-neutral-50/50 dark:hover:bg-admin-surface-hover/50 transition-colors duration-200"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${item.id}-${column.key}`}
                        className={`px-4 py-2 text-sm text-neutral-700 dark:text-admin-text ${column.className || ""}`}
                      >
                        {column.render ? column.render(item) : (item as Record<string, any>)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-row items-center justify-between gap-4">
          <Text className="text-xs text-neutral-400 dark:text-admin-text-dim font-semibold whitespace-nowrap">
            แสดง {data.length}{pagination.total !== undefined ? ` จาก ${pagination.total}` : ''} รายการ
          </Text>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            disabled={isLoading}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
