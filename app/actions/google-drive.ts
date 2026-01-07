"use server";

import { google } from "googleapis";

export async function getDriveImages() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!folderId || !apiKey) {
    console.error("Missing Google Drive environment variables");
    return [];
  }

  try {
    const drive = google.drive({ version: "v3", auth: apiKey });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, thumbnailLink, webContentLink, mimeType)",
      pageSize: 100, // Adjust as needed
    });

    const files = response.data.files;

    if (!files) return [];

    // Transform to a friendlier format if needed, or return as is
    // Note: thumbnailLink usually needs '&sz=s400' or similar appended for higher res thumbnails
    return files.map((file) => ({
      id: file.id,
      name: file.name,
      // High-res thumbnail hack
      src: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, "=s1024") : "", 
      originalLink: file.webContentLink,
      mimeType: file.mimeType,
    }));
  } catch (error) {
    console.error("Error fetching images from Drive:", error);
    return [];
  }
}
