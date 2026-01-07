import { getDriveImages } from "./actions/google-drive";
import Gallery from "@/components/Gallery";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const images = await getDriveImages();

  return (
    <main className="min-h-screen">
      {images.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-xl text-red-500">No images found or API not configured.</p>
          <p className="text-sm text-gray-400 mt-2">Please check your .env.local file.</p>
        </div>
      ) : (
        <Gallery images={images} />
      )}
    </main>
  );
}
