import { getAuthenticatedDrive } from "./google-auth";

/**
 * Extract Google Drive Folder ID from a URL
 */
export function extractFolderId(url: string): string | null {
  // Common patterns:
  // https://drive.google.com/drive/folders/ID
  // https://drive.google.com/drive/u/0/folders/ID
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Check if a Google Drive folder is shared with "Anyone with the link" as Viewer
 */
export async function isFolderPublic(folderId: string): Promise<boolean> {
  const drive = getAuthenticatedDrive();
  
  try {
    // Try to get folder metadata. If it's public (Anyone with the link), 
    // or shared with the Service Account, this will succeed.
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, mimeType",
    });

    if (response.data.mimeType !== "application/vnd.google-apps.folder") {
      throw new Error("ID นี้ไม่ใช่โฟลเดอร์ (ID is not a folder)");
    }

    return true;
  } catch (error: any) {
    console.error("Error checking folder access:", error.message);
    
    if (error.code === 404 || error.code === 403) {
      throw new Error("ไม่พบโฟลเดอร์ หรือไม่ได้เปิดแชร์แบบสาธารณะ (Folder not found or not public)");
    }
    
    throw new Error(`Google Drive API error: ${error.message}`);
  }
}
