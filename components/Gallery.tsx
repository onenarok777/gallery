"use client";

import { useState, useEffect } from "react";
import Masonry from "react-masonry-css";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";

import { getDriveImages } from "@/app/actions/google-drive";
import GalleryItem from "./GalleryItem";

// Interface for the image data
interface DriveImage {
  id: string | null | undefined;
  name: string | null | undefined;
  src: string;
  originalLink: string | null | undefined;
  mimeType: string | null | undefined;
  width?: number | null;
  height?: number | null;
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
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-wide transition-colors">
          My Gallery
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base tracking-wider transition-colors">
          Collection from Google Drive
        </p>
      </header>

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image, i) => (
          <GalleryItem 
            key={image.id} 
            image={image} 
            index={i} 
            onClick={setIndex} 
          />
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
