/**
 * Extract Google Drive Folder ID from a URL.
 *
 * Supports common patterns:
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - Raw folder ID string (25+ alphanumeric/dash/underscore chars)
 */
export function extractFolderId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
