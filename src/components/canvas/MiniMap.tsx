import React, { useRef, useState } from "react";
import type { PlacedImage, PlacedVideo } from "@/types/canvas";
import { cn } from "@/lib/utils";

interface MiniMapProps {
  images: PlacedImage[];
  videos: PlacedVideo[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  canvasSize: {
    width: number;
    height: number;
  };
  onViewportChange?: (viewport: {
    x: number;
    y: number;
    scale: number;
  }) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  images,
  videos,
  viewport,
  canvasSize,
  onViewportChange,
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Calculate bounds of all content
  let contentMinX = Infinity,
    contentMinY = Infinity;
  let contentMaxX = -Infinity,
    contentMaxY = -Infinity;

  // Calculate content bounds from both images and videos
  const hasContent = images.length > 0 || videos.length > 0;

  if (hasContent) {
    // Include images in bounds calculation
    images.forEach((img) => {
      contentMinX = Math.min(contentMinX, img.x);
      contentMinY = Math.min(contentMinY, img.y);
      contentMaxX = Math.max(contentMaxX, img.x + img.width);
      contentMaxY = Math.max(contentMaxY, img.y + img.height);
    });

    // Include videos in bounds calculation
    videos.forEach((vid) => {
      contentMinX = Math.min(contentMinX, vid.x);
      contentMinY = Math.min(contentMinY, vid.y);
      contentMaxX = Math.max(contentMaxX, vid.x + vid.width);
      contentMaxY = Math.max(contentMaxY, vid.y + vid.height);
    });
  } else {
    // If no content, center around origin
    contentMinX = -500;
    contentMinY = -500;
    contentMaxX = 500;
    contentMaxY = 500;
  }

  // Calculate current viewport bounds in canvas coordinates
  const viewportCanvasX = -viewport.x / viewport.scale;
  const viewportCanvasY = -viewport.y / viewport.scale;
  const viewportCanvasWidth = canvasSize.width / viewport.scale;
  const viewportCanvasHeight = canvasSize.height / viewport.scale;

  // Mobile vs Desktop bounds logic
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  let minX, minY, maxX, maxY;

  if (isMobile) {
    // Mobile: simple content-only bounds for clear overview
    minX = contentMinX;
    minY = contentMinY;
    maxX = contentMaxX;
    maxY = contentMaxY;
  } else {
    // Desktop: expand bounds to include both content AND current viewport
    minX = Math.min(contentMinX, viewportCanvasX);
    minY = Math.min(contentMinY, viewportCanvasY);
    maxX = Math.max(contentMaxX, viewportCanvasX + viewportCanvasWidth);
    maxY = Math.max(contentMaxY, viewportCanvasY + viewportCanvasHeight);
  }

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;
  // Responsive dimensions - mobile: w-32 h-24 (128x96), desktop: w-48 h-32 (192x128)
  const miniMapWidth = isMobile ? 128 : 192;
  const miniMapHeight = isMobile ? 96 : 128;

  // Calculate distance between viewport and content for enhanced styling
  const viewportCenterX = viewportCanvasX + viewportCanvasWidth / 2;
  const viewportCenterY = viewportCanvasY + viewportCanvasHeight / 2;
  const contentCenterX = hasContent ? (contentMinX + contentMaxX) / 2 : 0;
  const contentCenterY = hasContent ? (contentMinY + contentMaxY) / 2 : 0;
  const distance = Math.sqrt(
    Math.pow(viewportCenterX - contentCenterX, 2) +
      Math.pow(viewportCenterY - contentCenterY, 2),
  );
  const isFarFromContent = distance > 1000; // Consider "far" if >1000 pixels away

  // Calculate scale to fit total area (content + viewport) in minimap
  const scaleX = miniMapWidth / totalWidth;
  const scaleY = miniMapHeight / totalHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

  // Center total area in minimap
  const offsetX = (miniMapWidth - totalWidth * scale) / 2;
  const offsetY = (miniMapHeight - totalHeight * scale) / 2;

  // Handle click/drag to move viewport
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onViewportChange || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX =
      ((x - offsetX) / scale + minX) * viewport.scale - canvasSize.width / 2;
    const canvasY =
      ((y - offsetY) / scale + minY) * viewport.scale - canvasSize.height / 2;

    onViewportChange({
      ...viewport,
      x: -canvasX,
      y: -canvasY,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleMinimapClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMinimapClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse up listener to handle mouse up outside minimap
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      className={cn(
        "absolute top-4 right-2 md:right-4 z-20 bg-background/95 rounded-2xl p-1 md:p-2 backdrop-blur",
        "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
        "dark:shadow-none dark:border dark:border-border",
      )}
    >
      <div
        ref={minimapRef}
        className="relative w-32 h-24 md:w-48 md:h-32 bg-muted rounded-xl overflow-hidden cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Render tiny versions of images */}
        {images.map((img) => (
          <div
            key={img.id}
            className="absolute bg-primary/50"
            style={{
              left: `${(img.x - minX) * scale + offsetX}px`,
              top: `${(img.y - minY) * scale + offsetY}px`,
              width: `${img.width * scale}px`,
              height: `${img.height * scale}px`,
            }}
          />
        ))}

        {videos.map((vid) => (
          <div
            key={vid.id}
            className="absolute bg-primary"
            style={{
              left: `${(vid.x - minX) * scale + offsetX}px`,
              top: `${(vid.y - minY) * scale + offsetY}px`,
              width: `${vid.width * scale}px`,
              height: `${vid.height * scale}px`,
            }}
          />
        ))}

        {/* Viewport indicator with enhanced visibility when far from content */}
        <div
          className={`absolute border-2 ${
            isFarFromContent
              ? "border-orange-500 bg-orange-500/20 shadow-lg"
              : "border-blue-500 bg-blue-500/10"
          }`}
          style={{
            left: `${(viewportCanvasX - minX) * scale + offsetX}px`,
            top: `${(viewportCanvasY - minY) * scale + offsetY}px`,
            width: `${viewportCanvasWidth * scale}px`,
            height: `${viewportCanvasHeight * scale}px`,
            borderWidth: isFarFromContent ? "3px" : "2px",
          }}
        />

        {/* Content area indicator when far from content */}
        {isFarFromContent && hasContent && (
          <div
            className="absolute border-2 border-green-500 bg-green-500/10"
            style={{
              left: `${(contentMinX - minX) * scale + offsetX}px`,
              top: `${(contentMinY - minY) * scale + offsetY}px`,
              width: `${(contentMaxX - contentMinX) * scale}px`,
              height: `${(contentMaxY - contentMinY) * scale}px`,
            }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-center">Mini-map</p>
    </div>
  );
};
