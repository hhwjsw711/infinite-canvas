import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { useFileUploader } from "@/hooks/useFileUploader";
import type { PlacedImage, PlacedVideo } from "@/types/canvas";
import type { ViewportState } from "@/types/multiplayer";
import { useAuth } from "@clerk/nextjs";
import { debounce } from "@/lib/utils";
import { logError } from "@/lib/errors";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AutoSaveState {
  images: PlacedImage[];
  videos: PlacedVideo[];
  viewport: ViewportState;
}

interface UseAutoSaveOptions {
  canvasId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook for auto-saving canvas state to cloud storage
 *
 * @description Automatically saves canvas changes to Cloudflare D1 database
 * with debouncing. Handles image uploads to R2 before saving state.
 *
 * @param {UseAutoSaveOptions} options - Configuration options
 * @param {string} options.canvasId - ID of the canvas to save
 * @param {boolean} options.enabled - Whether auto-save is enabled (default: true)
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 2000)
 * @param {Function} options.onSaveStart - Callback when save starts
 * @param {Function} options.onSaveComplete - Callback when save completes
 * @param {Function} options.onSaveError - Callback when save fails
 *
 * @returns {Object} Auto-save controls
 * @returns {Function} returns.updateState - Update canvas state and trigger debounced save
 * @returns {Function} returns.saveNow - Force immediate save
 * @returns {boolean} returns.isSaving - Whether save is in progress
 *
 * @example
 * const { updateState, saveNow, isSaving } = useAutoSave({
 *   canvasId: 'abc123',
 *   onSaveComplete: () => console.log('Saved!'),
 *   onSaveError: (error) => console.error('Save failed:', error)
 * });
 */
export function useAutoSave({
  canvasId,
  enabled = true,
  debounceMs = 2000,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: UseAutoSaveOptions) {
  const { userId } = useAuth();
  const saveStateRef = useRef<AutoSaveState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFile } = useFileUploader();

  const updateCanvas = useMutation(api.canvases.updateCanvas);

  // Upload images that haven't been uploaded yet
  const uploadPendingImages = useCallback(
    async (images: PlacedImage[]) => {
      if (!canvasId) return images;

      const uploadPromises = images.map(async (image) => {
        // Skip if already uploaded or is a placeholder
        if (
          image.cloudImageId ||
          image.src.startsWith("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP")
        ) {
          return image;
        }

        // Skip if it's already a cloud URL
        if (!image.src.startsWith("data:") && !image.src.startsWith("blob:")) {
          return image;
        }

        try {
          const cloudImage = await uploadFile(image.src, canvasId);
          return {
            ...image,
            src: cloudImage.url,
            cloudImageId: cloudImage.id,
          };
        } catch (error) {
          logError(error, {
            context: "uploadPendingImages",
            imageId: image.id,
            canvasId,
          });
          // Return original image if upload fails
          return image;
        }
      });

      return Promise.all(uploadPromises);
    },
    [canvasId, uploadFile],
  );

  // Upload videos that haven't been uploaded yet
  const uploadPendingVideos = useCallback(
    async (videos: PlacedVideo[]) => {
      if (!canvasId) return videos;

      const uploadPromises = videos.map(async (video) => {
        // Skip if already uploaded or is a placeholder
        if (
          video.cloudVideoId ||
          video.src.startsWith("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP")
        ) {
          return video;
        }

        // Skip if it's already a cloud URL
        if (!video.src.startsWith("data:") && !video.src.startsWith("blob:")) {
          return video;
        }

        try {
          const cloudVideo = await uploadFile(video.src, canvasId);
          return {
            ...video,
            src: cloudVideo.url,
            cloudVideoId: cloudVideo.id,
          };
        } catch (error) {
          logError(error, {
            context: "uploadPendingVideos",
            videoId: video.id,
            canvasId,
          });
          // Return original video if upload fails
          return video;
        }
      });

      return Promise.all(uploadPromises);
    },
    [canvasId, uploadFile],
  );

  // Save function with offline support
  const performSave = useCallback(async () => {
    if (!canvasId || !userId || !saveStateRef.current || isSaving) {
      return;
    }

    const state = saveStateRef.current;
    setIsSaving(true);
    onSaveStart?.();

    try {
      // Check if we're online
      if (!navigator.onLine) {
        // Save to cache for background sync
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          const cache = await caches.open("canvas-sync");
          const syncRequest = new Request(`/sync/${canvasId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              canvasId,
              state,
              timestamp: Date.now(),
            }),
          });

          await cache.put(
            syncRequest.url,
            new Response(syncRequest.body, {
              status: 200,
              headers: syncRequest.headers,
            }),
          );

          // Register background sync
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).sync.register(`save-canvas-${canvasId}`);

          setIsSaving(false);
          onSaveComplete?.();
          return;
        }
      }

      // Upload any pending images
      const cloudImages = await uploadPendingImages(state.images);
      const cloudVideos = await uploadPendingVideos(state.videos);

      // Update canvas state in D1
      await updateCanvas({
        canvasId: canvasId as Id<"canvases">,
        state: {
          images: cloudImages,
          videos: cloudVideos,
          viewport: state.viewport,
          version: "1.0.0",
        },
      });

      onSaveComplete?.();
    } catch (error) {
      logError(error, {
        context: "performSave",
        canvasId,
        userId,
      });
      onSaveError?.(error as Error);
    } finally {
      setIsSaving(false);
    }
  }, [
    canvasId,
    userId,
    isSaving,
    uploadPendingImages,
    uploadPendingVideos,
    updateCanvas,
    onSaveStart,
    onSaveError,
    onSaveComplete,
  ]);

  // Debounced save
  const debouncedSave = useRef(debounce(performSave, debounceMs)).current;

  // Update state and trigger save
  const updateState = useCallback(
    (newState: AutoSaveState) => {
      if (!enabled || !canvasId) return;

      saveStateRef.current = newState;
      debouncedSave();
    },
    [enabled, canvasId, debouncedSave],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Debounced save will be cleaned up automatically
    };
  }, []);

  return {
    updateState,
    saveNow: performSave,
    isSaving: isSaving,
  };
}
