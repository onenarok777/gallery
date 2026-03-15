"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Masonry from "react-masonry-css";
const MasonryGrid = Masonry as any;
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
import FaceSearch from "./FaceSearch";
import Pagination from "./ui/Pagination";

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
  folderId: string;
  eventTitle: string;
  isPaginationEnabled?: boolean;
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
  initialTotalCount = 0,
  folderId,
  eventTitle,
  isPaginationEnabled = false,
}: GalleryProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [images, setImages] = useState(initialImages);
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialNextPageToken);
  const [totalCount] = useState(initialTotalCount);
  const [showFaceSearch, setShowFaceSearch] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingToPage, setIsLoadingToPage] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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

  const visibleImages = useMemo(() => {
    if (!isPaginationEnabled) return images;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return images.slice(start, end);
  }, [images, isPaginationEnabled, currentPage, pageSize]);

  const galleryElements = useMemo(
    () =>
      visibleImages.map((img) => ({
        src: img.src,
        thumb: img.src,
        downloadUrl: img.src,
        subHtml: `<h4>${img.name || "Image"}</h4>`,
      })),
    [visibleImages],
  );

  // Elements for LightGallery (synchronized with visibleImages)
  // When paginated, LightGallery only needs to know about the current page's images
  // When infinite scroll, it knows about all loaded images
  const initialGalleryElements = useMemo(
    () =>
      visibleImages.map((img) => ({
        src: img.src,
        thumb: img.src,
        downloadUrl: img.src,
        subHtml: `<h4>${img.name || "Image"}</h4>`,
      })),
    [visibleImages],
  );

  // --------------------------------------------------------------------------
  // Callbacks
  // --------------------------------------------------------------------------

  // Load more images from API
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextPageToken) return;

    setLoading(true);
    try {
      const response = await getDriveImages(folderId, nextPageToken);

      if (response.images?.length > 0) {
        setImages((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newImages = response.images.filter(
            (img: DriveImage) => !existingIds.has(img.id),
          );
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
  }, [loading, hasMore, nextPageToken, folderId]);

  // Handle pagination jumps (fetch sequentially if needed)
  const handlePageChange = async (newPage: number) => {
    if (newPage === currentPage) return;
    
    const requiredCount = newPage * pageSize;
    if (images.length < requiredCount && hasMore) {
      setIsLoadingToPage(true);
      let currentNextToken = nextPageToken;
      let currentImages = [...images];
      
      try {
        while (currentImages.length < requiredCount && currentNextToken) {
          const response = await getDriveImages(folderId, currentNextToken);
          if (response.images?.length > 0) {
            const existingIds = new Set(currentImages.map((p) => p.id));
            const newImages = response.images.filter(
              (img: DriveImage) => !existingIds.has(img.id),
            );
            currentImages = [...currentImages, ...newImages];
          }
          currentNextToken = response.nextPageToken;
        }
        setImages(currentImages);
        setNextPageToken(currentNextToken);
        setHasMore(!!currentNextToken);
      } catch (error) {
        console.error("Failed to load pages sequentially:", error);
      } finally {
        setIsLoadingToPage(false);
      }
    }
    
    setCurrentPage(newPage);
  };

  // Update total count display in Lightbox counter
  const updateTotalCountDisplay = useCallback(() => {
    const counterTotal = document.querySelector(".lg-counter-all");
    if (counterTotal && totalCount > 0) {
      counterTotal.textContent = totalCount.toString();
    }
  }, [totalCount]);

  // Open lightbox at specific index
  const openLightbox = useCallback((index: number) => {
    lightGalleryRef.current?.openGallery(index);
  }, []);

  // Open lightbox for a specific image from face search results
  const openLightboxByImageSrc = useCallback((imageSrc: string) => {
    const index = stateRef.current.images.findIndex(img => img.src === imageSrc);
    if (index >= 0) {
      lightGalleryRef.current?.openGallery(index);
    } else {
      // Image might not be loaded yet, open in new tab
      window.open(imageSrc, "_blank");
    }
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

  const onAfterSlide = useCallback(
    (detail: any) => {
      // Skip during programmatic refresh to avoid infinite loop
      if (isRefreshingRef.current) return;

      const { index } = detail;
      currentIndexRef.current = index;

      // Trigger load more when approaching the end (only in infinite scroll mode)
      const { images, hasMore, loading } = stateRef.current;
      if (!isPaginationEnabled && index >= images.length - 2 && hasMore && !loading) {
        loadMoreRef.current();
      }

      updateTotalCountDisplay();
    },
    [updateTotalCountDisplay, isPaginationEnabled],
  );

  const onAfterClose = useCallback(() => {
    // Skip during programmatic refresh
    if (isRefreshingRef.current) return;

    isLightboxOpenRef.current = false;
    document.body.style.overflow = "auto";

    // Refresh the gallery now that it's closed
    if (lightGalleryRef.current) {
      lightGalleryRef.current.refresh(galleryElements);
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
    if (!isPaginationEnabled && inView && hasMore && !loading && !isLightboxOpenRef.current) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore, isPaginationEnabled]);

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
      <header className="mb-16 text-center relative">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2 tracking-wide transition-colors">
          {eventTitle}
        </h1>
        <button
          onClick={() => setShowFaceSearch(true)}
          className="mt-6 inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-linear-to-r from-violet-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-200"
          id="face-search-btn"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          ค้นหาด้วยใบหน้า
        </button>
      </header>

      {/* Face Search Modal */}
      <FaceSearch
        isOpen={showFaceSearch}
        onClose={() => setShowFaceSearch(false)}
        onResultClick={openLightboxByImageSrc}
      />

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
        licenseKey="7284-9382-0192-3839"
        dynamicEl={initialGalleryElements}
      />

      {/* Top Pagination UI */}
      {isPaginationEnabled && totalPages > 1 && (
        <div className="w-full mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={isLoadingToPage || loading}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Masonry Grid */}
      <MasonryGrid
        breakpointCols={MASONRY_BREAKPOINTS}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {visibleImages.map((image, i) => (
          <GalleryItem
            key={image.id}
            image={image}
            index={i}
            onClick={openLightbox}
          />
        ))}
      </MasonryGrid>

      {/* Loading Indicator / Scroll Sentinel */}
      {!isPaginationEnabled && (hasMore || loading) && (
        <div
          ref={sentinelRef}
          className="w-full py-10 flex justify-center items-center"
        >
          {loading && (
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="mt-2 text-sm text-neutral-500">
                Loading more...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pagination UI */}
      {isPaginationEnabled && totalPages > 1 && (
        <div className="w-full flex flex-col items-center gap-6 border-t border-neutral-100 dark:border-admin-border mt-8 pt-8">
          {(isLoadingToPage || loading) && (
             <div className="flex items-center gap-2 text-sm text-neutral-500">
               <svg className="animate-spin h-5 w-5 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               กำลังโหลดข้อมูล...
             </div>
          )}
          <Pagination
            className="w-full"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            disabled={isLoadingToPage || loading}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
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
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.5) 0%,
            transparent 100%
          );
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
