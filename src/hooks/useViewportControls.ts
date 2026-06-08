/**
 * Custom hook for viewport pan/zoom controls
 * Handles:
 * - ViewBox state management
 * - Mouse wheel zoom with zoom towards cursor
 * - Mouse drag panning
 * - Touch pinch-to-zoom and pan
 * - Zoom in/out/reset controls
 * - Content bounds clamping
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  clampViewBoxToBounds,
  getTouchDistance,
  getTouchCenter,
  ZOOM_WHEEL_SCALE_IN,
  ZOOM_WHEEL_SCALE_OUT,
  ZOOM_IN_SCALE,
  ZOOM_OUT_SCALE,
  MIN_VIEWBOX_WIDTH,
  MAX_VIEWBOX_WIDTH,
  DEFAULT_VIEWBOX,
} from "../utils/index";

/**
 * Custom hook for managing viewport controls
 * @param {Object} contentBounds - Content bounds for clamping
 * @param {Object} svgRef - Reference to the SVG element
 * @returns {Object} Viewport state and handlers
 */
export function useViewportControls(contentBounds: any, svgRef: any) {
  const [viewBox, setViewBox] = useState(DEFAULT_VIEWBOX);
  const viewBoxRef = useRef(DEFAULT_VIEWBOX); // Ref to hold current viewBox for event handlers without triggering re-renders
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<any>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const panAnimationFrameRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);
  const [screenAspectRatio, setScreenAspectRatio] = useState(1);

  // Keep ref synced with state
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  /**
   * Update screen aspect ratio on resize
   */
  useEffect(() => {
    const updateAspectRatio = () => {
      if (typeof window !== "undefined") {
        setScreenAspectRatio(window.innerHeight / window.innerWidth);
      }
    };

    updateAspectRatio();
    window.addEventListener("resize", updateAspectRatio);
    window.addEventListener("orientationchange", updateAspectRatio);

    return () => {
      window.removeEventListener("resize", updateAspectRatio);
      window.removeEventListener("orientationchange", updateAspectRatio);
    };
  }, []);

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = useCallback(
    (e: any) => {
      e.preventDefault();

      const svg = svgRef.current;
      if (!svg) return;

      // Get mouse position relative to SVG
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouse position to SVG coordinates
      const pt = svg.createSVGPoint();
      pt.x = mouseX;
      pt.y = mouseY;
      const svgCTM = svg.getCTM();
      if (svgCTM) {
        const { x: svgX, y: svgY } = pt.matrixTransform(svgCTM.inverse());

        const scale = e.deltaY > 0 ? ZOOM_WHEEL_SCALE_IN : ZOOM_WHEEL_SCALE_OUT;

        requestAnimationFrame(() => {
          setViewBox((prev: any) => {
            const newWidth = prev.width * scale;

            // Bounds checking - prevent over-zooming
            const minWidth = MIN_VIEWBOX_WIDTH;
            const maxWidth = MAX_VIEWBOX_WIDTH; // Allow unlimited zoom out like the editor
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

            // Maintain screen aspect ratio for consistent panning
            const clampedHeight = clampedWidth * screenAspectRatio;

            const actualScale = clampedWidth / prev.width;

            // Calculate zoom towards mouse position
            const newX = prev.x + (svgX - prev.x) * (1 - actualScale);
            const newY = prev.y + (svgY - prev.y) * (1 - actualScale);

            // Don't clamp position - allow free panning like the editor
            return {
              ...prev,
              x: newX,
              y: newY,
              width: clampedWidth,
              height: clampedHeight,
            };
          });
        });
      }
    },
    [svgRef, screenAspectRatio],
  );

  /**
   * Handle mouse down for panning
   */
  const handleMouseDown = useCallback((e: any) => {
    if (e.button === 0) {
      setIsDragging(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  /**
   * Handle mouse move for panning
   */
  const handleMouseMove = useCallback(
    (e: any) => {
      if (isDragging && lastPanPoint) {
        const svg = svgRef.current;
        if (!svg) return;

        // Get screen pixel deltas
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;

        // Convert screen pixel movement to SVG coordinate movement
        const rect = svg.getBoundingClientRect();
        const scale = viewBox.width / rect.width;

        // Use requestAnimationFrame for smooth panning
        if (panAnimationFrameRef.current) {
          cancelAnimationFrame(panAnimationFrameRef.current);
        }

        panAnimationFrameRef.current = requestAnimationFrame(() => {
          setViewBox((prev: any) => {
            const newX = prev.x - dx * scale;
            const newY = prev.y - dy * scale;
            return { ...prev, x: newX, y: newY };
          });
          panAnimationFrameRef.current = null;
        });

        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, lastPanPoint, svgRef, viewBox.width],
  );

  /**
   * Handle mouse up to stop panning
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastPanPoint(null);
  }, []);

  /**
   * Handle touch start for pinch-to-zoom and panning
   */
  const handleTouchStart = useCallback((e: any) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      const target = e.target;
      let currentElement = target;
      let isSeatElement = false;

      while (currentElement && currentElement !== svgRef.current) {
        if (
          currentElement.getAttribute &&
          currentElement.getAttribute("data-seat-element") === "true"
        ) {
          isSeatElement = true;
          break;
        }
        currentElement = currentElement.parentElement || currentElement.parentNode;
      }

      if (isSeatElement) {
        return;
      }

      // e.preventDefault();
      setIsDragging(true);
      setLastPanPoint({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, []);

  /**
   * Handle touch move for pinch-to-zoom and panning
   */
  const handleTouchMove = useCallback(
    (e: any) => {
      const svg = svgRef.current;
      if (!svg) return;

      e.preventDefault();

      if (e.touches.length === 2 && lastTouchDistance) {
        const currentDistance = getTouchDistance(e.touches);
        const center = getTouchCenter(e.touches);

        if (currentDistance && center) {
          const scale = currentDistance / lastTouchDistance;

          // Get touch center relative to SVG
          const rect = svg.getBoundingClientRect();
          const mouseX = center.x - rect.left;
          const mouseY = center.y - rect.top;

          // Convert touch center to SVG coordinates
          const pt = svg.createSVGPoint();
          pt.x = mouseX;
          pt.y = mouseY;
          const svgCTM = svg.getCTM();
          if (svgCTM) {
            const { x: svgX, y: svgY } = pt.matrixTransform(svgCTM.inverse());

            requestAnimationFrame(() => {
              setViewBox((prev: any) => {
                const newWidth = prev.width / scale;

                // Bounds checking
                const minWidth = MIN_VIEWBOX_WIDTH;
                const maxWidth = MAX_VIEWBOX_WIDTH; // Allow unlimited zoom out like the editor
                const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

                // Maintain screen aspect ratio for consistent panning
                const clampedHeight = clampedWidth * screenAspectRatio;

                const actualScale = clampedWidth / prev.width;

                // Calculate zoom towards touch center
                const newX = prev.x + (svgX - prev.x) * (1 - actualScale);
                const newY = prev.y + (svgY - prev.y) * (1 - actualScale);

                return {
                  ...prev,
                  x: newX,
                  y: newY,
                  width: clampedWidth,
                  height: clampedHeight,
                };
              });
            });
          }
          setLastTouchDistance(currentDistance);
        }
      } else if (e.touches.length === 1 && isDragging && lastPanPoint) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastPanPoint.x;
        const dy = e.touches[0].clientY - lastPanPoint.y;
        const rect = svg.getBoundingClientRect();
        const scale = viewBox.width / rect.width;

        if (panAnimationFrameRef.current) {
          cancelAnimationFrame(panAnimationFrameRef.current);
        }
        panAnimationFrameRef.current = requestAnimationFrame(() => {
          setViewBox((prev: any) => {
            const newX = prev.x - dx * scale;
            const newY = prev.y - dy * scale;
            return { ...prev, x: newX, y: newY };
          });
          panAnimationFrameRef.current = null;
        });
        setLastPanPoint({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    },
    [
      isDragging,
      lastPanPoint,
      lastTouchDistance,
      svgRef,
      viewBox.width,
      screenAspectRatio,
    ],
  );

  /**
   * Handle touch end to stop panning/zooming
   */
  const handleTouchEnd = useCallback((e: any) => {
    const target = e.target;
    let currentElement = target;
    let isSeatElement = false;

    while (currentElement && currentElement !== svgRef.current) {
      if (
        currentElement.getAttribute &&
        currentElement.getAttribute("data-seat-element") === "true"
      ) {
        isSeatElement = true;
        break;
      }
      currentElement = currentElement.parentElement || currentElement.parentNode;
    }

    if (isSeatElement) {
      return;
    }

    e.preventDefault();
    setIsDragging(false);
    setLastPanPoint(null);
    setLastTouchDistance(null);
  }, []);

  /**
   * Easing function for smooth animation (ease-in-out)
   * @param {number} t - Progress value between 0 and 1
   * @returns {number} Eased value
   */
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  /**
   * Zoom in button handler with smooth animation
   */
  const zoomIn = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startViewBox: any = { ...viewBox };
    const scale = ZOOM_IN_SCALE;
    const newWidth = startViewBox.width * scale;

    const minWidth = MIN_VIEWBOX_WIDTH;
    const maxWidth = contentBounds ? contentBounds.width : MAX_VIEWBOX_WIDTH;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    const clampedHeight = clampedWidth * screenAspectRatio;

    const centerX = startViewBox.x + startViewBox.width / 2;
    const centerY = startViewBox.y + startViewBox.height / 2;

    const targetX = centerX - clampedWidth / 2;
    const targetY = centerY - clampedHeight / 2;

    const targetViewBox = {
      x: targetX,
      y: targetY,
      width: clampedWidth,
      height: clampedHeight,
    };

    const animationDuration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentViewBox = {
        x: startViewBox.x + (targetViewBox.x - startViewBox.x) * easedProgress,
        y: startViewBox.y + (targetViewBox.y - startViewBox.y) * easedProgress,
        width:
          startViewBox.width +
          (targetViewBox.width - startViewBox.width) * easedProgress,
        height:
          startViewBox.height +
          (targetViewBox.height - startViewBox.height) * easedProgress,
      };

      setViewBox(currentViewBox);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [viewBox, screenAspectRatio]);

  /**
   * Zoom out button handler with smooth animation
   */
  const zoomOut = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startViewBox: any = { ...viewBox };
    const scale = ZOOM_OUT_SCALE;
    const newWidth = startViewBox.width * scale;

    const minWidth = MIN_VIEWBOX_WIDTH;
    const maxWidth = MAX_VIEWBOX_WIDTH;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    const clampedHeight = clampedWidth * screenAspectRatio;

    const centerX = startViewBox.x + startViewBox.width / 2;
    const centerY = startViewBox.y + startViewBox.height / 2;

    const targetX = centerX - clampedWidth / 2;
    const targetY = centerY - clampedHeight / 2;

    const targetViewBox = {
      x: targetX,
      y: targetY,
      width: clampedWidth,
      height: clampedHeight,
    };

    const animationDuration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentViewBox = {
        x: startViewBox.x + (targetViewBox.x - startViewBox.x) * easedProgress,
        y: startViewBox.y + (targetViewBox.y - startViewBox.y) * easedProgress,
        width:
          startViewBox.width +
          (targetViewBox.width - startViewBox.width) * easedProgress,
        height:
          startViewBox.height +
          (targetViewBox.height - startViewBox.height) * easedProgress,
      };

      setViewBox(currentViewBox);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [contentBounds, viewBox, screenAspectRatio]);

  /**
   * Reset to center/fit view with smooth animation
   */
  const resetToCenter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startViewBox: any = { ...viewBox };
    let targetViewBox: any;

    if (contentBounds && screenAspectRatio > 0) {
      const contentAspectRatio = contentBounds.height / contentBounds.width;
      let width = contentBounds.width;
      let height = contentBounds.height;

      if (screenAspectRatio > contentAspectRatio) {
        height = width * screenAspectRatio;
      } else {
        width = height / screenAspectRatio;
      }

      targetViewBox = {
        x: contentBounds.minX - (width - contentBounds.width) / 2,
        y: contentBounds.minY - (height - contentBounds.height) / 2,
        width: width,
        height: height,
      };
    } else {
      targetViewBox = DEFAULT_VIEWBOX;
    }

    const animationDuration = 400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      const currentViewBox = {
        x: startViewBox.x + (targetViewBox.x - startViewBox.x) * easedProgress,
        y: startViewBox.y + (targetViewBox.y - startViewBox.y) * easedProgress,
        width:
          startViewBox.width +
          (targetViewBox.width - startViewBox.width) * easedProgress,
        height:
          startViewBox.height +
          (targetViewBox.height - startViewBox.height) * easedProgress,
      };

      setViewBox(currentViewBox);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [contentBounds, viewBox, screenAspectRatio]);

  /**
   * Zoom to specific element with smooth animation
   */
  const zoomToElement = useCallback(
    (element: any, paddingMultiplier = 1.5) => {
      if (!element) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      let elementCenterX: number, elementCenterY: number, scaledWidth: number, scaledHeight: number;

      if (element.pathBoundary && element.pathBoundary.points && element.pathBoundary.points.length > 0) {
        const points = element.pathBoundary.points;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        points.forEach((p: any) => {
          if (p && typeof p.x === "number" && typeof p.y === "number") {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          }
        });

        if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
          return;
        }

        elementCenterX = (minX + maxX) / 2;
        elementCenterY = (minY + maxY) / 2;
        scaledWidth = Math.max(maxX - minX, MIN_VIEWBOX_WIDTH / paddingMultiplier);
        scaledHeight = Math.max(maxY - minY, MIN_VIEWBOX_WIDTH / paddingMultiplier);
      } else {
        const scale = element.scale || 1.0;
        const width = element.width || 0;
        const height = element.height || 0;

        if (width <= 0 || height <= 0) return;

        scaledWidth = width * scale;
        scaledHeight = height * scale;

        if (typeof element.x !== "number" || typeof element.y !== "number") return;

        elementCenterX = element.x;
        elementCenterY = element.y;

        const rotation = element.rotation || 0;
        if (rotation !== 0) {
          const normalizedRotation = rotation % (Math.PI * 2);
          if (normalizedRotation !== 0) {
            const cos = Math.abs(Math.cos(normalizedRotation));
            const sin = Math.abs(Math.sin(normalizedRotation));
            const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
            const rotatedHeight = scaledWidth * sin + scaledHeight * cos;
            scaledWidth = rotatedWidth;
            scaledHeight = rotatedHeight;
          }
        }
      }

      const viewBoxWidth = scaledWidth * paddingMultiplier;

      if (viewBoxWidth <= 0 || !isFinite(viewBoxWidth)) return;

      const minWidth = MIN_VIEWBOX_WIDTH;
      const maxWidth = MAX_VIEWBOX_WIDTH;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, viewBoxWidth));

      const clampedHeight = clampedWidth * screenAspectRatio;

      let targetX = elementCenterX - clampedWidth / 2;
      let targetY = elementCenterY - clampedHeight / 2;

      if (contentBounds) {
        const clamped = clampViewBoxToBounds(
          { x: targetX, y: targetY, width: clampedWidth, height: clampedHeight },
          contentBounds,
        );
        targetX = clamped.x;
        targetY = clamped.y;
      }

      const startViewBox: any = { ...viewBox };
      const targetViewBox = {
        x: targetX,
        y: targetY,
        width: clampedWidth,
        height: clampedHeight,
      };

      const animationDuration = 600;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeInOutCubic(progress);

        const currentViewBox = {
          x: startViewBox.x + (targetViewBox.x - startViewBox.x) * easedProgress,
          y: startViewBox.y + (targetViewBox.y - startViewBox.y) * easedProgress,
          width:
            startViewBox.width +
            (targetViewBox.width - startViewBox.width) * easedProgress,
          height:
            startViewBox.height +
            (targetViewBox.height - startViewBox.height) * easedProgress,
        };

        setViewBox(currentViewBox);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [contentBounds, viewBox, screenAspectRatio],
  );

  // Initialize viewBox with contentBounds on first load
  useEffect(() => {
    if (contentBounds && !hasInitialized.current && screenAspectRatio > 0) {
      hasInitialized.current = true;

      const contentAspectRatio = contentBounds.height / contentBounds.width;
      let width = contentBounds.width;
      let height = contentBounds.height;

      if (screenAspectRatio > contentAspectRatio) {
        height = width * screenAspectRatio;
      } else {
        width = height / screenAspectRatio;
      }

      setViewBox({
        x: contentBounds.minX - (width - contentBounds.width) / 2,
        y: contentBounds.minY - (height - contentBounds.height) / 2,
        width: width,
        height: height,
      });
    }
  }, [contentBounds, screenAspectRatio]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Use non-passive listeners to allow e.preventDefault()
    // Wheel events on trackpads/mice
    svg.addEventListener("wheel", handleWheel, { passive: false });
    svg.addEventListener("touchstart", handleTouchStart, { passive: false });
    svg.addEventListener("touchmove", handleTouchMove, { passive: false });
    svg.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      svg.removeEventListener("wheel", handleWheel);
      svg.removeEventListener("touchstart", handleTouchStart);
      svg.removeEventListener("touchmove", handleTouchMove);
      svg.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, svgRef]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (panAnimationFrameRef.current) {
        cancelAnimationFrame(panAnimationFrameRef.current);
      }
    };
  }, []);

  return {
    viewBox,
    viewBoxRef,
    setViewBox,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    zoomIn,
    zoomOut,
    resetToCenter,
    zoomToElement,
  };
}

