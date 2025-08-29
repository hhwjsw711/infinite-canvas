import type { PlacedImage, PlacedVideo } from "@/types/canvas";
import type { CanvasElement } from "@/lib/storage";

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// Helper to convert PlacedImage to storage format
export const imageToCanvasElement = (image: PlacedImage): CanvasElement => ({
  id: image.id,
  type: "image",
  imageId: image.id, // We'll use the same ID for both
  transform: {
    x: image.x,
    y: image.y,
    scale: 1, // We store width/height separately, so scale is 1
    rotation: image.rotation,
    ...(image.cropX !== undefined && {
      cropBox: {
        x: image.cropX,
        y: image.cropY || 0,
        width: image.cropWidth || 1,
        height: image.cropHeight || 1,
      },
    }),
  },
  zIndex: 0, // We'll use array order instead
  width: image.width,
  height: image.height,
});

// Helper to convert PlacedVideo to storage format
export const videoToCanvasElement = (video: PlacedVideo): CanvasElement => ({
  id: video.id,
  type: "video",
  videoId: video.id, // We'll use the same ID for both
  transform: {
    x: video.x,
    y: video.y,
    scale: 1, // We store width/height separately, so scale is 1
    rotation: video.rotation,
    ...(video.cropX !== undefined && {
      cropBox: {
        x: video.cropX,
        y: video.cropY || 0,
        width: video.cropWidth || 1,
        height: video.cropHeight || 1,
      },
    }),
  },
  zIndex: 0, // We'll use array order instead
  width: video.width,
  height: video.height,
  duration: video.duration,
  currentTime: video.currentTime,
  isPlaying: video.isPlaying,
  volume: video.volume,
  muted: video.muted,
});

// Convert canvas coordinates to screen coordinates
export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  viewport: Viewport,
): { x: number; y: number } => {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y,
  };
};

// Calculate bounding box for an element (image or video) considering rotation
export const calculateBoundingBox = (
  element: PlacedImage | PlacedVideo,
): { x: number; y: number; width: number; height: number } => {
  const { x, y, width, height, rotation } = element;

  // If no rotation, return simple bounding box
  if (!rotation || rotation === 0) {
    return {
      x,
      y,
      width,
      height,
    };
  }

  // Convert rotation from degrees to radians
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Calculate the four corners of the original rectangle
  const corners = [
    { x: 0, y: 0 }, // top-left
    { x: width, y: 0 }, // top-right
    { x: width, y: height }, // bottom-right
    { x: 0, y: height }, // bottom-left
  ];

  // Rotate each corner around the top-left corner (0,0)
  const rotatedCorners = corners.map((corner) => ({
    x: corner.x * cos - corner.y * sin,
    y: corner.x * sin + corner.y * cos,
  }));

  // Find the bounding box of the rotated corners
  const xs = rotatedCorners.map((c) => c.x);
  const ys = rotatedCorners.map((c) => c.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: x + minX,
    y: y + minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Calculate the bounding box of selected images and videos
export const calculateSelectionBounds = (
  images: PlacedImage[],
  videos: PlacedVideo[],
  selectedIds: string[],
) => {
  if (selectedIds.length === 0) return null;

  const selectedImages = images.filter((img) => selectedIds.includes(img.id));
  const selectedVideos = videos.filter((vid) => selectedIds.includes(vid.id));

  if (selectedImages.length === 0 && selectedVideos.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Process selected images
  selectedImages.forEach((image) => {
    const bounds = calculateBoundingBox(image);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  // Process selected videos (using same bounding box calculation as images)
  selectedVideos.forEach((video) => {
    const bounds = calculateBoundingBox(video);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

// Find empty space on the canvas for an element (image or video)
export const findEmptySpaceForElement = (
  element: PlacedImage | PlacedVideo,
  allElements: Array<PlacedImage | PlacedVideo>,
  index: number = 0,
  gap: number = 50,
): { x: number; y: number } => {
  // Filter out the current element from the list
  const otherElements = allElements.filter((el) => el.id !== element.id);

  if (otherElements.length === 0) {
    // If no other elements, place at origin
    return { x: 0, y: 0 };
  }

  // Find the rightmost edge of all elements
  let rightmostX = -Infinity;
  let topY = Infinity;

  otherElements.forEach((el) => {
    const bounds = calculateBoundingBox(el);
    rightmostX = Math.max(rightmostX, bounds.x + bounds.width);
    topY = Math.min(topY, bounds.y);
  });

  // Position new element to the right of existing elements
  // If multiple elements are being reset, offset them horizontally
  const x = rightmostX + gap + index * (element.width + gap);
  const y = topY;

  // Check if this position overlaps with any existing element
  const proposedBounds = {
    x,
    y,
    width: element.width,
    height: element.height,
  };

  // Simple overlap check
  let overlaps = false;
  for (const otherElement of otherElements) {
    const otherBounds = calculateBoundingBox(otherElement);
    if (
      proposedBounds.x < otherBounds.x + otherBounds.width &&
      proposedBounds.x + proposedBounds.width > otherBounds.x &&
      proposedBounds.y < otherBounds.y + otherBounds.height &&
      proposedBounds.y + proposedBounds.height > otherBounds.y
    ) {
      overlaps = true;
      break;
    }
  }

  // If overlaps, try positioning below the existing elements
  if (overlaps) {
    let bottomY = -Infinity;
    otherElements.forEach((el) => {
      const bounds = calculateBoundingBox(el);
      bottomY = Math.max(bottomY, bounds.y + bounds.height);
    });

    return {
      x: gap + index * (element.width + gap),
      y: bottomY + gap,
    };
  }

  return { x, y };
};

// Check if two elements overlap or are too close
export const checkElementOverlapOrProximity = (
  el1: PlacedImage | PlacedVideo,
  el2: PlacedImage | PlacedVideo,
  minGap: number = 10,
): boolean => {
  // Get bounding boxes for both elements (considering rotation)
  const bounds1 = calculateBoundingBox(el1);
  const bounds2 = calculateBoundingBox(el2);

  // Add gap to bounds for proximity check
  const expandedBounds1 = {
    x: bounds1.x - minGap,
    y: bounds1.y - minGap,
    width: bounds1.width + minGap * 2,
    height: bounds1.height + minGap * 2,
  };

  // Check if expanded bounds overlap
  return (
    expandedBounds1.x < bounds2.x + bounds2.width &&
    expandedBounds1.x + expandedBounds1.width > bounds2.x &&
    expandedBounds1.y < bounds2.y + bounds2.height &&
    expandedBounds1.y + expandedBounds1.height > bounds2.y
  );
};

// Check if an element needs resetting (rotated, wrong size, or overlapping/too close to others)
export const elementNeedsReset = (
  element: PlacedImage | PlacedVideo,
  allElements: Array<PlacedImage | PlacedVideo>,
  minGap: number = 10,
  resetSize: number = 200,
): boolean => {
  // Check if rotated
  if (element.rotation !== 0) {
    return true;
  }

  // Check if size differs from reset size (with small tolerance for aspect ratio adjustments)
  const aspectRatio = element.width / element.height;
  let expectedWidth = resetSize;
  let expectedHeight = resetSize / aspectRatio;

  if (expectedHeight > resetSize) {
    expectedHeight = resetSize;
    expectedWidth = resetSize * aspectRatio;
  }

  const tolerance = 1; // Allow 1px difference due to rounding
  if (
    Math.abs(element.width - expectedWidth) > tolerance ||
    Math.abs(element.height - expectedHeight) > tolerance
  ) {
    return true;
  }

  // Check if overlapping or too close
  for (const otherElement of allElements) {
    if (otherElement.id === element.id) continue;

    if (checkElementOverlapOrProximity(element, otherElement, minGap)) {
      return true;
    }
  }

  return false;
};

// Calculate bounding box from an array of coordinates and dimensions
export const calculateBoundsFromCoordinates = (
  items: Array<{ x: number; y: number; width: number; height: number }>,
) => {
  if (items.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  items.forEach((item) => {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};
