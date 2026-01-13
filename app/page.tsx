import { getDriveImages } from "./actions/google-drive";
import Gallery from "@/components/Gallery";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const { images, error } = await getDriveImages();

  return (
    <main className="min-h-screen">
      {error ? (
        <div className="text-center py-20 px-4">
           <p className="text-xl text-red-500">API Error Occurred</p>
           <p className="text-md text-red-400 mt-2">{error}</p>

        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-16 h-16 mb-6 rounded-full bg-neutral-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-light text-white mb-3 tracking-wide">
            No Images Found
          </h2>
          <p className="text-neutral-500 text-sm max-w-md text-center leading-relaxed">
            Your gallery is currently empty. Please check your configuration or add images to the connected Google Drive folder.
          </p>
          

        </div>
      ) : (
        <Gallery images={images} />
      )}
    </main>
  );
}
