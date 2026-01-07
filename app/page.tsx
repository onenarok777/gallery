import { getDriveImages } from "./actions/google-drive";
import Gallery from "@/components/Gallery";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const images = await getDriveImages();

  return (
    <main className="min-h-screen p-4 md:p-8 bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">My Gallery</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Collection from Google Drive
          </p>
        </header>

        {images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-red-500">No images found or API not configured.</p>
            <p className="text-sm text-gray-400 mt-2">Please check your .env.local file.</p>
          </div>
        ) : (
          <Gallery images={images} />
        )}
      </div>
    </main>
  );
}
