"use server";

import { revalidatePath } from "next/cache";

// Secret token to protect this endpoint
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

export async function revalidateGallery(secret: string) {
  // Verify secret token
  if (!REVALIDATE_SECRET || secret !== REVALIDATE_SECRET) {
    return { success: false, error: "Invalid secret" };
  }

  try {
    // Revalidate the main gallery page
    revalidatePath("/", "page");
    
    return { 
      success: true, 
      message: "Gallery cache revalidated",
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown error" };
  }
}
