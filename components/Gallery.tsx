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
  initialImages: DriveImage[];
  initialNextPageToken?: string;
  initialTotalCount?: number;
}

export default function Gallery({ initialImages, initialNextPageToken, initialTotalCount = 0 }: GalleryProps) {
  const [images, setImages] = useState(initialImages);
  // ... rest of state ...
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialNextPageToken);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const lightGalleryRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  
  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px", // Trigger loading before reaching bottom
  });

  // Load more images handler
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextPageToken) return;

    setLoading(true);
    try {
      const response = await getDriveImages(search, nextPageToken);
      
      if (response.images && response.images.length > 0) {
        setImages(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUniqueImages = response.images.filter((img: DriveImage) => !existingIds.has(img.id));
          return [...prev, ...newUniqueImages];
        });
      }
      
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken);
    } catch (error) {
      console.error("Failed to load more images", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextPageToken, search]);

  // Sync images with LightGallery instance
  useEffect(() => {
    if (lightGalleryRef.current) {
        lightGalleryRef.current.refresh(images.map((img) => ({
            src: img.src,
            thumb: img.src,
            downloadUrl: img.src,
            subHtml: `<h4>${img.name || "Image"}</h4>`,
        })));
    }
  }, [images.length]); // Only refresh when count changes

  // Update total count display in Lightbox
  const updateTotalCountDisplay = useCallback(() => {
      const counterTotal = document.querySelector('.lg-counter-all');
      if (counterTotal && totalCount > 0) {
          counterTotal.textContent = totalCount.toString();
      }
  }, [totalCount]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  // Trigger server-side search
  const performSearch = async () => {
    setIsSearching(true);
    setImages([]); // Clear current images
    setNextPageToken(undefined);
    setHasMore(true);
    
    try {
      // First page of search
      const response = await getDriveImages(search);
      setImages(response.images || []);
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken);
      // Search results usually have exact count as length if single page, 
      // but if paginated, total is unknown unless we fetch header or count again.
      // For now, let's keep totalCount as initial total or update if we implement separate search count.
      // Ideally reset total count if searching, but user asked for Google Drive Folder ID total.
      // If we are searching, the "total" in context of search is different. 
      // Let's assume user wants "Total in Folder" always, or "Total Results".
      // Given the request "total amount from google folder id", likely means the global total.
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

  const galleryElements = useMemo(() => {
    return images.map((img) => ({
      src: img.src,
      thumb: img.src,
      downloadUrl: img.src,
      subHtml: `<h4>${img.name || "Image"}</h4>`,
    }));
  }, [images]);

  // Stable plugins array defined outside or via useMemo
  const plugins = useMemo(() => [lgZoom, lgRotate, lgFullscreen, lgThumbnail], []);

  // Stable callbacks
  const onInit = useCallback((detail: any) => {
    lightGalleryRef.current = detail.instance;
  }, []);

  const onBeforeOpen = useCallback(() => {
    document.body.style.overflow = "hidden";
    setTimeout(updateTotalCountDisplay, 100);
  }, [updateTotalCountDisplay]);

  const onAfterOpen = useCallback(() => {
    updateTotalCountDisplay();
  }, [updateTotalCountDisplay]);

  // Use refs to access latest state in callbacks without re-creating them
  const stateRef = useRef({ images, hasMore, loading });
  useEffect(() => {
    stateRef.current = { images, hasMore, loading };
  }, [images, hasMore, loading]);

  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  const onAfterSlide = useCallback((detail: any) => {
      const { index } = detail;
      currentIndexRef.current = index;
      
      const { images, hasMore, loading } = stateRef.current;
      // Load more if we are near the end (e.g., within 5 slides)
      if (index >= images.length - 5 && hasMore && !loading) {
          loadMoreRef.current();
      }
      updateTotalCountDisplay();
  }, [updateTotalCountDisplay]);

  const onAfterClose = useCallback(() => {
    document.body.style.overflow = "auto";
  }, []);

    // Create a static reference for the initial render to prevent React component from re-initializing
  const initialGalleryElements = useMemo(() => {
    return initialImages.map((img) => ({
      src: img.src,
      thumb: img.src,
      downloadUrl: img.src,
      subHtml: `<h4>${img.name || "Image"}</h4>`,
    }));
  }, []); // Empty dependency array = never changes after mount

  // Manual refresh effect to handle updates without destroying the instance
  useEffect(() => {
    if (lightGalleryRef.current) {
        // Refresh the instance with the new full list of images
        lightGalleryRef.current.refresh(galleryElements);
    }
  }, [galleryElements]);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 py-20">
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-wide transition-colors">
          My Gallery
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base tracking-wider transition-colors">
          Collection for GotTries
        </p>
      </header>

      {/* Hidden LightGallery - triggered programmatically */}
      <LightGallery
        onInit={onInit}
        onBeforeOpen={onBeforeOpen}
        onAfterOpen={onAfterOpen}
        onAfterSlide={onAfterSlide}
        onAfterClose={onAfterClose}
        plugins={plugins}
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
      
      {/* Loading Indicator / Sentinel */}
      {(hasMore || loading) && (
        <div ref={ref} className="w-full py-10 flex justify-center items-center">
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
