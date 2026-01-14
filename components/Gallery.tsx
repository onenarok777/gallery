"use client";

import { useState, useCallback, useRef } from "react";
import Masonry from "react-masonry-css";
import LightGallery from "lightgallery/react";
import lgZoom from "lightgallery/plugins/zoom";
import lgRotate from "lightgallery/plugins/rotate";
import lgFullscreen from "lightgallery/plugins/fullscreen";
import lgThumbnail from "lightgallery/plugins/thumbnail";

// Styles
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-rotate.css";
import "lightgallery/css/lg-fullscreen.css";
import "lightgallery/css/lg-thumbnail.css";

import { getDriveImages } from "@/app/actions/google-drive";
import GalleryItem from "./GalleryItem";

// Interface for the image data
interface DriveImage {
  id: string | null | undefined;
  name: string | null | undefined;
  src: string;
  originalSrc?: string;
  mimeType: string | null | undefined;
  width?: number | null;
  height?: number | null;
}

interface GalleryProps {
  images: DriveImage[];
}

export default function Gallery({ images: initialImages }: GalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const lightGalleryRef = useRef<any>(null);

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

  // Open lightGallery at specific index
  const openLightbox = useCallback((index: number) => {
    if (lightGalleryRef.current) {
      lightGalleryRef.current.openGallery(index);
    }
  }, []);

  // Breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    768: 2,
    500: 2,
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-20">
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-wide transition-colors">
          My Gallery
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base tracking-wider transition-colors">
          Collection from Google Drive
        </p>
      </header>

      {/* Hidden LightGallery - triggered programmatically */}
      <LightGallery
        onInit={(detail) => {
          lightGalleryRef.current = detail.instance;
        }}
        plugins={[lgZoom, lgRotate, lgFullscreen, lgThumbnail]}
        speed={500}
        download={true}
        rotateLeft={true}
        rotateRight={true}
        flipHorizontal={true}
        flipVertical={true}
        dynamic={true}
        dynamicEl={images.map((img) => ({
          src: img.src,
          thumb: img.src,
          downloadUrl: img.src,
          subHtml: `<h4>${img.name || "Image"}</h4>`,
        }))}
      />

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
            onClick={openLightbox} 
          />
        ))}
      </Masonry>

      <style jsx global>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -16px;
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px;
          background-clip: padding-box;
        }
        
        /* Custom lightGallery styles */
        .lg-backdrop {
          background-color: rgba(0, 0, 0, 0.95);
        }
        .lg-toolbar {
          background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
        }
        .lg-outer .lg-thumb-outer {
          background-color: rgba(0, 0, 0, 0.8);
        }
        .lg-outer .lg-thumb-item {
          border-radius: 4px;
          border: 2px solid transparent;
        }
        .lg-outer .lg-thumb-item.active,
        .lg-outer .lg-thumb-item:hover {
          border-color: #fff;
        }
      `}</style>
    </div>
  );
}
