"use client";

import { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";

import { getDriveImages } from "@/app/actions/google-drive";

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
      const { images: results } = await getDriveImages(search);
      setImages(results || []);
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

  // Real-time polling
  useEffect(() => {
    // Only poll if not searching
    if (search) return;

    const intervalId = setInterval(async () => {
      try {
        const { images: newImages } = await getDriveImages();
        if (newImages && newImages.length > 0) {
           // Simple check to avoid re-renders if data matches strictly
           // (This is a basic check; deep compare or timestamp check would be better but this suffices for now)
           setImages(current => {
             if (current.length === newImages.length && current[0]?.id === newImages[0]?.id) {
               return current;
             }
             return newImages;
           });
        }
      } catch (error) {
        console.error("Polling failed", error);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [search]);

  // Breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    768: 2, // Tablet
    500: 2, // Mobile strictly 2 columns
  };

  return (
    <div 
      className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-20"
    >
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-wide">
          My Gallery
        </h1>
        <p className="text-neutral-400 text-sm md:text-base tracking-wider">
          Collection from Google Drive
        </p>
      </header>

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, i) => (
          <div
            key={image.id}
            className="mb-4 group"
          >
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 transition-all duration-500 ease-out">
              <img
                  src={image.originalLink || image.src}
                  alt={image.name || "Gallery Image"}
                  className="w-full h-auto cursor-pointer object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setIndex(i)}
                  style={{ display: "block" }}
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              {/* Optional: Add watermark/text overlay if desired, based on screenshot "got tries." */}
              <div className="absolute bottom-3 left-3 opacity-80 pointer-events-none">
                 <p className="text-[10px] text-white/70 font-light tracking-widest uppercase">got tries.</p>
              </div>
            </div>
          </div>
        ))}
      </Masonry>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Download]}
        slides={images.map((img) => ({ 
            src: img.originalLink || img.src,
            downloadUrl: img.originalLink || img.src
        }))}
      />

      <style jsx global>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -16px; /* gap-4 (16px) offset */
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px; /* gap-4 (16px) */
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}
