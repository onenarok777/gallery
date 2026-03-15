import { notFound } from "next/navigation";
import { getDriveImages, getTotalImageCount } from "@/app/actions/google-drive";
import { extractFolderId } from "@/lib/extract-folder-id";
import Gallery from "@/components/Gallery";

// ============================================================================
// Types
// ============================================================================

interface EventData {
  id: string;
  title: string;
  driveLink: string;
  isPaginationEnabled?: boolean;
}

// ============================================================================
// Data Fetching
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchEvent(eventId: string): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// Page
// ============================================================================

export const revalidate = 60;

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch event from API
  const event = await fetchEvent(id);
  if (!event) return notFound();

  // 2. Extract folder ID from driveLink
  const folderId = extractFolderId(event.driveLink);
  if (!folderId) return notFound();

  // 3. Fetch images using folder ID
  const [data, totalCount] = await Promise.all([
    getDriveImages(folderId),
    getTotalImageCount(folderId),
  ]);

  const { images, error, nextPageToken } = data;

  // 4. Render
  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      {error ? (
        <div className="text-center py-20 px-4">
          <p className="text-xl text-red-500">เกิดข้อผิดพลาด</p>
          <p className="text-md text-red-400 mt-2">{error}</p>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-16 h-16 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-colors">
            <svg
              className="w-8 h-8 text-neutral-400 dark:text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-light text-neutral-800 dark:text-white mb-3 tracking-wide transition-colors">
            แกลเลอรีว่างเปล่า
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md text-center leading-relaxed transition-colors">
            ยังไม่มีรูปภาพในขณะนี้ กรุณากลับมาตรวจสอบอีกครั้งในภายหลัง
          </p>
        </div>
      ) : (
        <Gallery
          initialImages={images}
          initialNextPageToken={nextPageToken}
          initialTotalCount={totalCount}
          folderId={folderId}
          eventTitle={event.title}
          isPaginationEnabled={event.isPaginationEnabled}
        />
      )}
    </main>
  );
}
