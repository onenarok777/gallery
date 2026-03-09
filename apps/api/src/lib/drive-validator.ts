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
    // Check permissions of the folder
    const response = await drive.permissions.list({
      fileId: folderId,
      fields: "permissions(type,role)",
    });

    const permissions = response.data.permissions || [];
    
    // Check if there's a permission where type is 'anyone' and role is 'reader' (or 'writer', 'owner')
    const isPublic = permissions.some(p => 
      p.type === "anyone" && (p.role === "reader" || p.role === "commenter" || p.role === "writer")
    );

    return isPublic;
  } catch (error: any) {
    console.error("Error checking folder permissions:", error.message);
    if (error.code === 404) {
      throw new Error("Folder not found or Service Account has no access");
    }
    throw new Error(`Google Drive API error: ${error.message}`);
  }
}
