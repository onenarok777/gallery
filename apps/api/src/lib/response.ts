import { Context } from "hono";

// ============================================================================
// Types
// ============================================================================

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_page: number;
  total: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

// ============================================================================
// Success Helpers
// ============================================================================

/**
 * Single object or non-paginated response
 * → { data: T, message: "" }
 */
export const successResponse = <T>(
  c: Context,
  data: T,
  status: number = 200,
  message: string = ""
) => {
  return c.json({ data, message } as ApiResponse<T>, status as any);
};

/**
 * Paginated list response
 * → { data: T[], meta: { page, page_size, total_page, total }, message: "" }
 */
export const paginatedResponse = <T>(
  c: Context,
  data: T[],
  meta: PaginationMeta,
  message: string = ""
) => {
  return c.json({ data, meta, message } as ApiResponse<T[]>, 200 as any);
};

// ============================================================================
// Error Helper
// ============================================================================

export const errorResponse = (
  c: Context,
  error: string,
  status: number = 400,
  message: string = ""
) => {
  return c.json({ error, message } as ApiErrorResponse, status as any);
};
