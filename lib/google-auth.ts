import { google } from "googleapis";

/**
 * Get authenticated Google Drive client using Service Account
 * 
 * Required environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 */
export function getAuthenticatedDrive() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error("Missing Service Account credentials in environment variables");
  }

  // Create JWT auth client
  const auth = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"), // Handle escaped newlines from env
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  // Return authenticated Drive client
  return google.drive({ version: "v3", auth });
}
