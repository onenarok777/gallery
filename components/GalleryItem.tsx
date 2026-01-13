"use client";

import { useState } from "react";

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
  // We use the direct src which is now ORIGINAL (s0)
  const src = image.src; 

  return (
    <div
      id={`gallery-item-${image.id}`}
      className="mb-4 group"
      style={{ aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : 'auto' }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
        
        {/* Loading State Overlay */}
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

        {/* Native Image Display - Browser handles queueing and caching much better for thumbnails */}
        <img
          src={src}
          alt={image.name || "Gallery Image"}
          className={`w-full h-full cursor-pointer object-cover transition-all duration-700 ease-in-out group-hover:scale-105 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onClick={() => onClick(index)}
          onError={() => setIsLoaded(true)} // Just hide loader on error, don't fallback
          loading="lazy"
          style={{ display: "block" }} 
        />
        
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"></div>
      </div>
    </div>
  );
}
