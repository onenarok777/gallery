import { getDriveImages, getTotalImageCount } from "./actions/google-drive";
import Gallery from "@/components/Gallery";
import { ThemeToggle } from "@/components/theme-toggle";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const [data, totalCount] = await Promise.all([
    getDriveImages(),
    getTotalImageCount()
  ]);
  
  const { images, error, nextPageToken } = data;

  // Fire-and-forget webhook renewal check (Lazy Initialization)
  // This ensures that even if the cron job fails or hasn't run, the first user to visit
  // will re-activate the real-time updates.
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
    if (siteUrl && process.env.REVALIDATE_SECRET) {
      // We don't await this because we don't want to slow down the user's page load
      // Just fire the request to renew subscription if needed
      const webhookUrl = `${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}/api/webhook/register?secret=${process.env.REVALIDATE_SECRET}`;
      fetch(webhookUrl, { method: 'POST' }).catch(err => console.error("Auto-webhook refresh failed:", err));
    }
  } catch (e) {
    // Ignore errors during rendering
  }

  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      {error ? (
        <div className="text-center py-20 px-4">
           <p className="text-xl text-red-500">API Error Occurred</p>
           <p className="text-md text-red-400 mt-2">{error}</p>

        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-16 h-16 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-colors">
            <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-light text-neutral-800 dark:text-white mb-3 tracking-wide transition-colors">
            No Images Found
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md text-center leading-relaxed transition-colors">
            Your gallery is currently empty. Please check your configuration or add images to the connected Google Drive folder.
          </p>
          

        </div>
      ) : (
        <Gallery 
          initialImages={images} 
          initialNextPageToken={nextPageToken} 
          initialTotalCount={totalCount}
        />
      )}
    </main>
  );
}
