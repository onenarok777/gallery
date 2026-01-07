"use client";

import { useState } from "react";
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
    500: 2, // Mobile 2 columns
  };

  return (
    <div 
      className="w-full max-w-[1800px] mx-auto px-8 md:px-16 py-20"
    >
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 tracking-[0.2em] uppercase font-thin slide-in-bottom" style={{ fontFamily: 'var(--font-playfair)' }}>
          My Gallery
        </h1>
        <p className="text-neutral-500 text-xs tracking-[0.4em] uppercase font-medium">
          Curated Collection
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
            className="mb-1 group"
          >
            <div className="relative overflow-hidden bg-neutral-900 transition-all duration-700 ease-out">
              <img
                  src={image.src}
                  alt={image.name || "Object"}
                  className="w-full h-auto cursor-pointer object-cover transition-all duration-1000 ease-out group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setIndex(i)}
              />
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
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
          margin-left: -4px; /* gap-1 (4px) offset */
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 4px; /* gap-1 (4px) */
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}
