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

export default function Gallery({ images }: GalleryProps) {
  const [index, setIndex] = useState(-1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Breakpoints for Masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  const handleDownload = async (item: DriveImage) => {
    const targetUrl = item.originalLink || item.src;
    
    setDownloadingId(item.id || "temp");
    
    try {
      // Fetch via proxy to avoid CORS
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = item.name || `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);

      // Verify if we can show a success message (optional)
      // alert("Saving to gallery..."); 
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download image");
    } finally {
      setDownloadingId(null);
    }
  };

  // Custom Long Press Hook Logic inside the map
  // (Simplified for inline usage within the map loop)
  const useLongPressLogic = (item: DriveImage) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const start = () => {
      timerRef.current = setTimeout(() => {
        // Trigger download after 2 seconds
        handleDownload(item);
        // Vibrate to give feedback (if supported)
        if (navigator.vibrate) navigator.vibrate(200);
      }, 2000); // 2 seconds
    };

    const stop = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    return {
      onTouchStart: start,
      onTouchEnd: stop,
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop
    };
  };

  return (
    <div className="w-full">
      {downloadingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-xl">
            <p className="font-semibold px-4">Saving image...</p>
          </div>
        </div>
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
            <InteractiveImage 
              image={image} 
              index={i} 
              setIndex={setIndex}
              onLongPress={() => handleDownload(image)}
            />
          </div>
        ))}
      </Masonry>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((img) => ({ src: img.src }))}
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

// Separate component to handle long press cleanly for each item
function InteractiveImage({ image, index, setIndex, onLongPress }: { 
  image: DriveImage, 
  index: number, 
  setIndex: (i: number) => void,
  onLongPress: () => void
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
    }, 2000); // 2 seconds threshold
  };

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = () => {
    if (!isLongPress.current) {
      setIndex(index);
    }
  };

  return (
    <div
      className="relative cursor-pointer group select-none"
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress} // Cancel if user scrolls
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onClick={handleClick}
      onContextMenu={(e) => {
        // Optional: disable default context menu on long press
        // e.preventDefault();
      }}
    >
      <img
        src={image.src}
        alt={image.name || "Gallery Image"}
        className="w-full h-auto transform transition-transform duration-300 group-hover:scale-105 pointer-events-none" // pointer-events-none prevents dragging imageGhost
        loading="lazy"
      />
    </div>
  );
}
