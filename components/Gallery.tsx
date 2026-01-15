"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Masonry from "react-masonry-css";
import LightGallery from "lightgallery/react";
import lgZoom from "lightgallery/plugins/zoom";
import lgRotate from "lightgallery/plugins/rotate";
import lgFullscreen from "lightgallery/plugins/fullscreen";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import { useInView } from "react-intersection-observer";

// Styles
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-rotate.css";
import "lightgallery/css/lg-fullscreen.css";
import "lightgallery/css/lg-thumbnail.css";

import { getDriveImages } from "@/app/actions/google-drive";
import GalleryItem from "./GalleryItem";

// ============================================================================
// Types
// ============================================================================

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
  initialImages: DriveImage[];
  initialNextPageToken?: string;
  initialTotalCount?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MASONRY_BREAKPOINTS = {
  default: 4,
  1280: 3,
  768: 2,
  500: 2,
};

const LIGHTGALLERY_PLUGINS = [lgZoom, lgRotate, lgFullscreen, lgThumbnail];

// ============================================================================
// Component
// ============================================================================

export default function Gallery({ 
  initialImages, 
  initialNextPageToken, 
  initialTotalCount = 0 
}: GalleryProps) {
  
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  
  const [images, setImages] = useState(initialImages);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialNextPageToken);
  const [totalCount] = useState(initialTotalCount);

  // --------------------------------------------------------------------------
  // Refs
  // --------------------------------------------------------------------------
  
  const lightGalleryRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const isLightboxOpenRef = useRef(false);
  const isRefreshingRef = useRef(false);
  
  // Refs for accessing latest state in stable callbacks
  const stateRef = useRef({ images, hasMore, loading });
  const loadMoreRef = useRef<() => void>(() => {});

  // Intersection Observer for infinite scroll
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // --------------------------------------------------------------------------
  // Memoized Values
  // --------------------------------------------------------------------------

  const galleryElements = useMemo(() => 
    images.map((img) => ({
      src: img.src,
      thumb: img.src,
      downloadUrl: img.src,
      subHtml: `<h4>${img.name || "Image"}</h4>`,
    })), 
  [images]);

  // Initial elements for LightGallery (static, prevents re-initialization)
  const initialGalleryElements = useMemo(() => 
    initialImages.map((img) => ({
      src: img.src,
      thumb: img.src,
      downloadUrl: img.src,
      subHtml: `<h4>${img.name || "Image"}</h4>`,
    })), 
  []);

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  // Load more images from API
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextPageToken) return;

    setLoading(true);
    try {
      const response = await getDriveImages(nextPageToken);
      
      if (response.images?.length > 0) {
        setImages(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newImages = response.images.filter((img: DriveImage) => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      }
      
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken);
    } catch (error) {
      console.error("Failed to load more images:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextPageToken]);

  // Update total count display in Lightbox counter
  const updateTotalCountDisplay = useCallback(() => {
    const counterTotal = document.querySelector('.lg-counter-all');
    if (counterTotal && totalCount > 0) {
      counterTotal.textContent = totalCount.toString();
    }
  }, [totalCount]);

  // Open lightbox at specific index
  const openLightbox = useCallback((index: number) => {
    lightGalleryRef.current?.openGallery(index);
  }, []);

  // --------------------------------------------------------------------------
  // LightGallery Event Handlers
  // --------------------------------------------------------------------------

  const onInit = useCallback((detail: any) => {
    lightGalleryRef.current = detail.instance;
  }, []);

  const onBeforeOpen = useCallback(() => {
    isLightboxOpenRef.current = true;
    document.body.style.overflow = "hidden";
    setTimeout(updateTotalCountDisplay, 100);
  }, [updateTotalCountDisplay]);

  const onAfterOpen = useCallback(() => {
    updateTotalCountDisplay();
  }, [updateTotalCountDisplay]);

  const onAfterSlide = useCallback((detail: any) => {
    // Skip during programmatic refresh to avoid infinite loop
    if (isRefreshingRef.current) return;

    const { index } = detail;
    currentIndexRef.current = index;
    
    // Trigger load more when approaching the end
    const { images, hasMore, loading } = stateRef.current;
    if (index >= images.length - 2 && hasMore && !loading) {
      loadMoreRef.current();
    }
    
    updateTotalCountDisplay();
  }, [updateTotalCountDisplay]);

  const onAfterClose = useCallback(() => {
    // Skip during programmatic refresh
    if (isRefreshingRef.current) return;

    isLightboxOpenRef.current = false;
    document.body.style.overflow = "auto";
    
    // Refresh the gallery now that it's closed (to include any images loaded while it was open)
    if (lightGalleryRef.current) {
      const currentElements = stateRef.current.images.map((img) => ({
        src: img.src,
        thumb: img.src,
        downloadUrl: img.src,
        subHtml: `<h4>${img.name || "Image"}</h4>`,
      }));
      lightGalleryRef.current.refresh(currentElements);
    }
    
    // Resume loading if there's more
    const { hasMore, loading } = stateRef.current;
    if (hasMore && !loading) {
      loadMoreRef.current();
    }
  }, []);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Keep refs in sync with latest state
  useEffect(() => {
    stateRef.current = { images, hasMore, loading };
  }, [images, hasMore, loading]);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Infinite scroll trigger (page scroll only, not when lightbox is open)
  useEffect(() => {
    if (inView && hasMore && !loading && !isLightboxOpenRef.current) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  // Refresh LightGallery when images change - ONLY when lightbox is CLOSED
  // This prevents the closing/flashing issue entirely
  useEffect(() => {
    const instance = lightGalleryRef.current;
    if (!instance) return;

    // If lightbox is open, skip refresh to prevent closing
    // Images will be refreshed when user closes the lightbox
    if (isLightboxOpenRef.current) {
      console.log("Skipping refresh while lightbox is open");
      return;
    }

    // Safe to refresh when closed
    instance.refresh(galleryElements);
  }, [galleryElements]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-20">
      {/* Header */}
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-wide transition-colors">
          My Gallery
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base tracking-wider transition-colors">
          Collection for GotTries
        </p>
      </header>

      {/* LightGallery (Hidden, triggered programmatically) */}
      <LightGallery
        onInit={onInit}
        onBeforeOpen={onBeforeOpen}
        onAfterOpen={onAfterOpen}
        onAfterSlide={onAfterSlide}
        onAfterClose={onAfterClose}
        plugins={LIGHTGALLERY_PLUGINS}
        speed={500}
        download={true}
        rotateLeft={true}
        rotateRight={true}
        flipHorizontal={true}
        flipVertical={true}
        thumbnail={true}
        toggleThumb={true}
        allowMediaOverlap={true}
        dynamic={true}
        licenseKey="0000-0000-000-0000"
        dynamicEl={initialGalleryElements}
      />

      {/* Masonry Grid */}
      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
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
      
      {/* Loading Indicator / Scroll Sentinel */}
      {(hasMore || loading) && (
        <div ref={sentinelRef} className="w-full py-10 flex justify-center items-center">
          {loading && (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-2 text-sm text-neutral-500">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Styles */}
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
        
        /* LightGallery custom styles */
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
