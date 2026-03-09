import { Context } from "hono";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export const successResponse = (c: Context, data: any, status: number = 200) => {
  return c.json({
    success: true,
    data,
  }, status as any);
};

export const errorResponse = (c: Context, message: string, status: number = 400, code?: string) => {
  return c.json({
    success: false,
    error: message,
    code,
  }, status as any);
};
