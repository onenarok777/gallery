"use client";

import { useState, useRef, useCallback } from "react";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Interface for the image data
interface DriveImage {
  id: string | null | undefined;
  name: string | null | undefined;
  src: string;
  originalLink: string | null | undefined;
  mimeType: string | null | undefined;
}

interface GalleryProps {
  images: DriveImage[];
}

import { getDriveImages } from "@/app/actions/google-drive";

// ... (previous imports)

export default function Gallery({ images: initialImages }: GalleryProps) {
  const [images, setImages] = useState(initialImages); // Use local state for images
  const [index, setIndex] = useState(-1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Trigger server-side search
  const performSearch = async () => {
    setIsSearching(true);
    try {
      const results = await getDriveImages(search);
      setImages(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  // Breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <div className="w-full">
      {/* ... (downloadingId modal same as before) ... */}

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search images (e.g., 'face', 'cat')..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-3 border rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500"
        />
        <button 
          onClick={performSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {isSearching ? "..." : "Search"}
        </button>
      </div>

      {images.length === 0 && !isSearching && (
         <p className="text-center text-gray-500 mt-4">No images found matching "{search}"</p>
      )}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, i) => (
          <div
            key={image.id}
            className="mb-4 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          >
            <img
                src={image.src}
                alt={image.name || "Gallery Image"}
                className="w-full h-auto cursor-pointer transform transition-transform duration-300 hover:scale-105"
                loading="lazy"
                onClick={() => setIndex(i)}
            />
          </div>
        ))}
      </Masonry>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        // Google CDN links (s0) generally work directly without proxy
        slides={images.map((img) => ({ 
            src: img.originalLink || img.src 
        }))}
      />

      <style jsx global>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -16px; /* gutter size offset */
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px; /* gutter size */
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}
