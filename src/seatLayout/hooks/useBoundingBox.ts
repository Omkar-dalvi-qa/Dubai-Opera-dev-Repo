export function getPanBounds(
  scale: number,
  viewport: { width: number; height: number },
  contentSize: { width: number; height: number }
) {
  const scaledWidth = contentSize.width * scale;
  const scaledHeight = contentSize.height * scale;

  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  // If content is wider than viewport, we can pan.
  // minX is when the right edge of content touches right edge of viewport.
  // maxX is when the left edge of content touches left edge of viewport (0).
  if (scaledWidth > viewport.width) {
    minX = viewport.width - scaledWidth;
    maxX = 0;
  } else {
    // If content is smaller than viewport, center it.
    // The pan X required to center it:
    minX = (viewport.width - scaledWidth) / 2;
    maxX = minX;
  }

  // Same logic for height
  if (scaledHeight > viewport.height) {
    minY = viewport.height - scaledHeight;
    maxY = 0;
  } else {
    minY = (viewport.height - scaledHeight) / 2;
    maxY = minY;
  }

  return { minX, maxX, minY, maxY };
}

export function useBoundingBox() {
  return getPanBounds;
}
