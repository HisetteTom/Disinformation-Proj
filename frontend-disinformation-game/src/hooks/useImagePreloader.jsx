import { useState, useRef, useCallback } from "react";

/**
 * Custom hook for preloading images
 * @returns {Object} The image loading status and preload function
 */
export function useImagePreloader() {
  const [imagesStatus, setImagesStatus] = useState({
    loading: false,
    error: false,
    loaded: 0,
    total: 0,
  });

  // We'll use a ref to track which images we're already loading
  const loadingImagesRef = useRef(new Set());

  const preloadImages = useCallback((imageSources) => {
    if (!imageSources || imageSources.length === 0) {
      setImagesStatus({ loading: false, error: false, loaded: 0, total: 0 });
      return;
    }

    // Filter out null values and get unique image sources
    const sources = Array.isArray(imageSources) ? [...new Set(imageSources.filter((src) => src && typeof src === "string"))] : [];

    if (sources.length === 0) {
      setImagesStatus({ loading: false, error: false, loaded: 0, total: 0 });
      return;
    }

    // Skip if we've already started loading these exact images
    const sourcesKey = sources.sort().join("|");
    if (loadingImagesRef.current.has(sourcesKey)) {
      return;
    }

    // Mark this batch as loading
    loadingImagesRef.current.add(sourcesKey);

    setImagesStatus((prev) => ({
      ...prev,
      loading: true,
      total: sources.length,
    }));

    let loadedCount = 0;

    sources.forEach((src) => {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        setImagesStatus((prev) => ({
          ...prev,
          loaded: loadedCount,
          loading: loadedCount < sources.length,
        }));
      };

      img.onerror = () => {
        loadedCount++;
        setImagesStatus((prev) => ({
          ...prev,
          loaded: loadedCount,
          loading: loadedCount < sources.length,
          error: true,
        }));
        console.error(`Failed to load image: ${src}`);
      };

      // Use a direct URL for GCP sources
      let imageUrl = src;
      if (src.startsWith("gs://")) {
        const gsPath = src.replace("gs://", "");
        const [bucketName, ...pathParts] = gsPath.split("/");
        const objectPath = pathParts.join("/");

        // Use the direct endpoint for profiles
        if (bucketName === "disinformation-game-profiles") {
          imageUrl = `/api/media/profiles/direct?bucket=${bucketName}&path=${encodeURIComponent(objectPath)}`;
        } else {
          // Use direct-gcp endpoint for other media
          imageUrl = `/api/media/direct-gcp?bucket=${bucketName}&path=${encodeURIComponent(objectPath)}`;
        }
      }

      img.src = imageUrl;
    });
  }, []);

  return { imagesStatus, preloadImages };
}

export default useImagePreloader;