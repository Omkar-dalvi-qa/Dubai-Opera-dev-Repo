import { useRef, useCallback, useEffect } from 'react';

export interface ZoomPanConfig {
  contentSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
  /**
   * World-space top-left corner of the content. When provided, `resetView` and
   * pan-bounds calculations correctly centre the content at its actual world
   * position rather than assuming it starts at (0, 0).
   * Default: { x: 0, y: 0 }
   */
  contentOrigin?: { x: number; y: number };
  /** Minimum zoom level (default: 0.1) */
  minZoom?: number;
  /** Maximum zoom level (default: 5) */
  maxZoom?: number;
  /** Zoom sensitivity for scroll wheel (default: 0.002) */
  zoomSensitivity?: number;
  /** Button zoom step factor (default: 1.3) */
  zoomStepFactor?: number;
  /** Padding fraction when fitting to screen (default: 0.05) */
  fitPadding?: number;
  /** Extra pan/zoom slack as fraction of viewport size (default: 0.5) */
  panExpansionRatio?: number;
  /** Called whenever the scale changes (for UI reactions like fading overlays) */
  onScaleChange?: (scale: number) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function useZoomPanSVG(
  svgRef: React.RefObject<SVGSVGElement | null>,
  gRef: React.RefObject<SVGGElement | null>,
  config: ZoomPanConfig
) {
  const {
    contentSize,
    viewportSize,
    contentOrigin,
    minZoom = 0.1,
    maxZoom = 5,
    zoomSensitivity = 0.002,
    zoomStepFactor = 1.3,
    fitPadding = 0.05,
    panExpansionRatio = 0.5,
    onScaleChange,
  } = config;

  // World-space centre of the content (accounts for non-zero origin).
  const contentCenterX = (contentOrigin?.x ?? 0) + contentSize.width / 2;
  const contentCenterY = (contentOrigin?.y ?? 0) + contentSize.height / 2;

  const onScaleChangeRef = useRef(onScaleChange);
  onScaleChangeRef.current = onScaleChange;

  const effectiveMinZoom = minZoom;
  const effectiveMaxZoom = Math.max(maxZoom, minZoom);

  const transform = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTransform = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number>(0);

  // Touch pinch state
  const touchState = useRef({
    initialDist: 0,
    initialScale: 1,
    initialCenter: { x: 0, y: 0 },
    initialTransform: { x: 0, y: 0 },
    activeTouchCount: 0,
  });

  // ─── Apply transform to SVG <g> ──────────────────────────────
  const applyTransform = useCallback(() => {
    if (gRef.current) {
      const { x, y, scale } = transform.current;
      gRef.current.setAttribute(
        'transform',
        `translate(${x}, ${y}) scale(${scale})`
      );
    }
  }, [gRef]);

  // ─── Pan bounding logic ──────────────────────────────────────
  const getPanBounds = useCallback(
    (scale: number) => {
      const scaledW = contentSize.width * scale;
      const scaledH = contentSize.height * scale;
      const vw = viewportSize.width;
      const vh = viewportSize.height;
      const expandX = vw * panExpansionRatio;
      const expandY = vh * panExpansionRatio;

      // tx needed to centre the content in the viewport (world origin aware).
      // When content starts at world (ox, oy), a translate(tx,ty) scale(s) group
      // maps world point p → viewport at (tx + p.x*s, ty + p.y*s).
      // Centre: tx = vw/2 - contentCentreX * s
      const idealTx = vw / 2 - contentCenterX * scale;
      const idealTy = vh / 2 - contentCenterY * scale;

      let minX: number, maxX: number, minY: number, maxY: number;

      if (scaledW > vw) {
        minX = idealTx - expandX - (scaledW - vw) / 2;
        maxX = idealTx + expandX + (scaledW - vw) / 2;
      } else {
        minX = idealTx - expandX;
        maxX = idealTx + expandX;
      }

      if (scaledH > vh) {
        minY = idealTy - expandY - (scaledH - vh) / 2;
        maxY = idealTy + expandY + (scaledH - vh) / 2;
      } else {
        minY = idealTy - expandY;
        maxY = idealTy + expandY;
      }

      return { minX, maxX, minY, maxY };
    },
    [viewportSize, contentSize, contentCenterX, contentCenterY, panExpansionRatio]
  );

  // ─── Clamp position within bounds ────────────────────────────
  const clampPosition = useCallback(
    (x: number, y: number, scale: number) => {
      const bounds = getPanBounds(scale);
      return {
        x: Math.max(bounds.minX, Math.min(x, bounds.maxX)),
        y: Math.max(bounds.minY, Math.min(y, bounds.maxY)),
      };
    },
    [getPanBounds]
  );

  // ─── Set transform with clamping ─────────────────────────────
  const setTransform = useCallback(
    (newX: number, newY: number, newScale: number) => {
      const clampedScale = Math.max(effectiveMinZoom, Math.min(newScale, effectiveMaxZoom));
      const clamped = clampPosition(newX, newY, clampedScale);
      transform.current = { x: clamped.x, y: clamped.y, scale: clampedScale };
      applyTransform();
      onScaleChangeRef.current?.(clampedScale);
    },
    [clampPosition, applyTransform, effectiveMinZoom, effectiveMaxZoom]
  );

  // ─── Smooth animated transform ──────────────────────────────
  const animateTo = useCallback(
    (targetX: number, targetY: number, targetScale: number, duration = 300) => {
      const startTime = performance.now();
      const startX = transform.current.x;
      const startY = transform.current.y;
      const startScale = transform.current.scale;

      const clampedScale = Math.max(effectiveMinZoom, Math.min(targetScale, effectiveMaxZoom));
      const clampedPos = clampPosition(targetX, targetY, clampedScale);

      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        const x = startX + (clampedPos.x - startX) * eased;
        const y = startY + (clampedPos.y - startY) * eased;
        const scale = startScale + (clampedScale - startScale) * eased;

        transform.current = { x, y, scale };
        applyTransform();
        onScaleChangeRef.current?.(scale);

        if (progress < 1) {
          animFrameId.current = requestAnimationFrame(animate);
        }
      };

      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = requestAnimationFrame(animate);
    },
    [clampPosition, applyTransform, effectiveMinZoom, effectiveMaxZoom]
  );

  // ─── Reset / fit-to-view ─────────────────────────────────────
  const resetView = useCallback(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return;

    const scaleX = viewportSize.width / contentSize.width;
    const scaleY = viewportSize.height / contentSize.height;
    let scale = Math.min(scaleX, scaleY) * (1 - fitPadding);
    scale = Math.max(effectiveMinZoom, Math.min(scale, effectiveMaxZoom));

    // Centre the world-space content in the viewport.
    // tx = vpW/2 - contentCentreX * scale  (pan transform maps world→viewport)
    const x = viewportSize.width / 2 - contentCenterX * scale;
    const y = viewportSize.height / 2 - contentCenterY * scale;

    animateTo(x, y, scale);
  }, [viewportSize, contentSize, contentCenterX, contentCenterY, animateTo, fitPadding, effectiveMinZoom, effectiveMaxZoom]);

  // ─── Zoom centered on a screen-space point ───────────────────
  const performZoom = useCallback(
    (clientX: number, clientY: number, scaleFactor: number) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      const { x: cx, y: cy, scale: cs } = transform.current;

      let newScale = cs * scaleFactor;
      newScale = Math.max(effectiveMinZoom, Math.min(newScale, effectiveMaxZoom));

      const actualFactor = newScale / cs;

      // Zoom pivot formula: keeps the point under cursor stationary
      const newX = px - (px - cx) * actualFactor;
      const newY = py - (py - cy) * actualFactor;

      setTransform(newX, newY, newScale);
    },
    [setTransform, effectiveMinZoom, effectiveMaxZoom, svgRef]
  );

  // ─── Wheel handler — rAF-coalesced (trackpads emit very high-frequency wheel events;
  // without batching, getBoundingClientRect + DOM writes each event causes jank). ──
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let accDeltaY = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let wheelRaf = 0;

    const flushWheel = () => {
      wheelRaf = 0;
      if (accDeltaY === 0) return;

      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = 0;

      const mergedDeltaY = accDeltaY;
      accDeltaY = 0;

      const delta = -mergedDeltaY;
      const scaleFactor = Math.exp(delta * zoomSensitivity);
      performZoom(lastClientX, lastClientY, scaleFactor);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= svg.clientHeight > 0 ? svg.clientHeight : 800;

      accDeltaY += dy;
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (!wheelRaf) {
        wheelRaf = requestAnimationFrame(flushWheel);
      }
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheel);
      if (wheelRaf) cancelAnimationFrame(wheelRaf);
    };
  }, [svgRef, performZoom, zoomSensitivity]);

  // ─── Drag / pan handler (mouse) ──────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only left button, don't start drag on seat clicks
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastTransform.current = { x: transform.current.x, y: transform.current.y };
      svg.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      setTransform(
        lastTransform.current.x + dx,
        lastTransform.current.y + dy,
        transform.current.scale
      );
    };

    const onMouseUp = () => {
      isDragging.current = false;
      svg.style.cursor = 'grab';
    };

    svg.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      svg.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [svgRef, setTransform]);

  // ─── Touch handlers (pan + pinch) ────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single-finger pan
        isDragging.current = true;
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastTransform.current = {
          x: transform.current.x,
          y: transform.current.y,
        };
        touchState.current.activeTouchCount = 1;
      } else if (e.touches.length === 2) {
        // Two-finger pinch
        e.preventDefault();
        isDragging.current = false;
        touchState.current.activeTouchCount = 2;

        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        touchState.current.initialDist = dist;
        touchState.current.initialScale = transform.current.scale;
        touchState.current.initialCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        touchState.current.initialTransform = {
          x: transform.current.x,
          y: transform.current.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging.current && touchState.current.activeTouchCount === 1) {
        const dx = e.touches[0].clientX - dragStart.current.x;
        const dy = e.touches[0].clientY - dragStart.current.y;
        setTransform(
          lastTransform.current.x + dx,
          lastTransform.current.y + dy,
          transform.current.scale
        );
      } else if (e.touches.length === 2 && touchState.current.activeTouchCount === 2) {
        e.preventDefault();

        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const scaleFactor = dist / touchState.current.initialDist;
        const newScale = touchState.current.initialScale * scaleFactor;

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Pan delta from center movement
        const panDx = centerX - touchState.current.initialCenter.x;
        const panDy = centerY - touchState.current.initialCenter.y;

        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const pivotX = touchState.current.initialCenter.x - rect.left;
        const pivotY = touchState.current.initialCenter.y - rect.top;

        const factor = newScale / touchState.current.initialScale;

        const newX = pivotX - (pivotX - touchState.current.initialTransform.x) * factor + panDx;
        const newY = pivotY - (pivotY - touchState.current.initialTransform.y) * factor + panDy;

        setTransform(newX, newY, newScale);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isDragging.current = false;
        touchState.current.activeTouchCount = 0;
      } else if (e.touches.length === 1) {
        // Transition from pinch to pan
        isDragging.current = true;
        touchState.current.activeTouchCount = 1;
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastTransform.current = {
          x: transform.current.x,
          y: transform.current.y,
        };
      }
    };

    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });
    svg.addEventListener('touchend', onTouchEnd);
    svg.addEventListener('touchcancel', onTouchEnd);

    return () => {
      svg.removeEventListener('touchstart', onTouchStart);
      svg.removeEventListener('touchmove', onTouchMove);
      svg.removeEventListener('touchend', onTouchEnd);
      svg.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [svgRef, setTransform]);

  // ─── Button zoom helpers ─────────────────────────────────────
  const zoomIn = useCallback(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2 + rect.left;
    const cy = rect.height / 2 + rect.top;
    performZoom(cx, cy, zoomStepFactor);
  }, [performZoom, svgRef, zoomStepFactor]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2 + rect.left;
    const cy = rect.height / 2 + rect.top;
    performZoom(cx, cy, 1 / zoomStepFactor);
  }, [performZoom, svgRef, zoomStepFactor]);

  // ─── Zoom to a specific content-space point ──────────────────
  // contentX/Y are in the coordinate system of the content (before scaling).
  // This smoothly animates to center that point on screen at the given zoom.
  const zoomToContentPoint = useCallback(
    (contentX: number, contentY: number, targetScale?: number) => {
      if (viewportSize.width === 0) return;

      const scale = targetScale ?? Math.max(transform.current.scale, 1);
      const clampedScale = Math.max(effectiveMinZoom, Math.min(scale, effectiveMaxZoom));

      // We want the content point to land at the center of the viewport
      const targetX = viewportSize.width / 2 - contentX * clampedScale;
      const targetY = viewportSize.height / 2 - contentY * clampedScale;

      animateTo(targetX, targetY, clampedScale, 600);
    },
    [viewportSize, animateTo, effectiveMinZoom, effectiveMaxZoom]
  );
  // ─── Zoom to fit a content-space rectangle ────────────────────
  // contentMinX/Y and contentMaxX/Y define the bounding box in content space.
  // Smoothly animates to fit the rectangle with some padding.
  const zoomToFitRect = useCallback(
    (contentMinX: number, contentMinY: number, contentMaxX: number, contentMaxY: number, padding = 0.1) => {
      if (viewportSize.width === 0) return;

      const rectW = contentMaxX - contentMinX;
      const rectH = contentMaxY - contentMinY;
      if (rectW <= 0 || rectH <= 0) return;

      const scaleX = viewportSize.width / rectW;
      const scaleY = viewportSize.height / rectH;
      let scale = Math.min(scaleX, scaleY) * (1 - padding);
      scale = Math.max(effectiveMinZoom, Math.min(scale, effectiveMaxZoom));

      // Center of the rect in content space
      const centerX = (contentMinX + contentMaxX) / 2;
      const centerY = (contentMinY + contentMaxY) / 2;

      const targetX = viewportSize.width / 2 - centerX * scale;
      const targetY = viewportSize.height / 2 - centerY * scale;

      animateTo(targetX, targetY, scale, 600);
    },
    [viewportSize, animateTo, effectiveMinZoom, effectiveMaxZoom]
  );

  // Keep current zoom within bounds when min/max change (e.g. viewport resize).
  useEffect(() => {
    const { x, y, scale } = transform.current;
    if (scale < effectiveMinZoom || scale > effectiveMaxZoom) {
      setTransform(x, y, scale);
    }
  }, [effectiveMinZoom, effectiveMaxZoom, setTransform]);

  // ─── Current scale getter ───────────────────────────────────
  const getScale = useCallback(() => transform.current.scale, []);

  // ─── Expose whether drag is active (for child click prevention) ──
  const getIsDragging = useCallback(() => isDragging.current, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameId.current);
  }, []);

  return {
    resetView,
    zoomIn,
    zoomOut,
    zoomToContentPoint,
    zoomToFitRect,
    getScale,
    getIsDragging,
    performZoom,
  };
}
