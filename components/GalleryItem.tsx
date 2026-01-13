"use client";

import { useState, useEffect } from "react";
import { downloadQueue } from "@/lib/download-queue";

interface DriveImage {
  id: string | null | undefined;
  name: string | null | undefined;
  src: string;
  originalLink: string | null | undefined;
  mimeType: string | null | undefined;
  width?: number | null;
  height?: number | null;
}

interface GalleryItemProps {
  image: DriveImage;
  index: number;
  onClick: (index: number) => void;
}

export default function GalleryItem({ image, index, onClick }: GalleryItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useState<HTMLDivElement | null>(null); // Ref type for callback

  // Simple intersection observer to trigger load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" } // Trigger slightly before view
    );

    const currentRef = document.getElementById(`gallery-item-${image.id}`);
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => observer.disconnect();
  }, [image.id]);

  useEffect(() => {
    if (!isInView || objectUrl) return;

    const src = image.originalLink || image.src;
    
    // Use the download queue singleton
    const cancel = downloadQueue.enqueue(
      image.id || src,
      src,
      (percent) => setProgress(percent),
      (blob) => {
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setIsLoaded(true);
      },
      (error) => {
        console.error(`Download failed for ${image.id}:`, error);
        // Fallback to src
        setObjectUrl(src);
        setIsLoaded(true);
      }
    );

    return () => {
      cancel();
    };
  }, [isInView, image.id, image.originalLink, image.src, objectUrl]);

  return (
    <div
      id={`gallery-item-${image.id}`}
      className="mb-4 group"
      style={{ aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : 'auto' }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
        
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 z-10 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 -translate-x-full animate-[shimmer_1.5s_infinite] pointer-events-none" />
             
             <svg 
               className="w-8 h-8 text-neutral-300 dark:text-neutral-700 animate-pulse relative z-20" 
               fill="none" 
               viewBox="0 0 24 24" 
               stroke="currentColor"
             >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             <span className="mt-2 text-[10px] md:text-xs text-neutral-400 dark:text-neutral-600 font-light tracking-widest uppercase animate-pulse relative z-20">
               Loading...
             </span>
          </div>
        )}

        {/* Image Display */}
        {objectUrl && (
          <img
            src={objectUrl}
            alt={image.name || "Gallery Image"}
            className={`w-full h-full cursor-pointer object-cover transition-all duration-700 ease-in-out group-hover:scale-105 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => onClick(index)}
            style={{ display: "block" }}
          />
        )}
        
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"></div>


      </div>
    </div>
  );
}
