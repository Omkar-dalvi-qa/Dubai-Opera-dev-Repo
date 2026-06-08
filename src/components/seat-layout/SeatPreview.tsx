"use client";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";

/**
 * SeatPreview Component - Mini-map showing overview of seat layout
 * Displays a simplified view of the entire layout with current viewport indicator
 * Clicking on the preview navigates to that area
 */
const SeatPreview = React.memo(
  ({
    contentBounds,
    viewBox,
    seatMap,
    canvasSceneData,
    setViewBox,
    getSeatColor,
    selectedSeats,
  }: any) => {
    const [isDraggingViewport, setIsDraggingViewport] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [viewportStart, setViewportStart] = useState({ x: 0, y: 0 });
    const svgRef = useRef<any>(null);
    // Calculate actual bounds from seatMap (transformed positions) and canvas elements
    // This ensures the preview matches the actual rendered content
    const actualBounds = useMemo(() => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasContent = false;

      // Calculate bounds from actual seat positions (transformed coordinates)
      if (seatMap && Object.keys(seatMap).length > 0) {
        Object.values(seatMap).forEach((seat: any) => {
          const { position, dimensions } = seat;
          const halfWidth = (dimensions?.width || 20) / 2;
          const halfHeight = (dimensions?.height || 20) / 2;

          minX = Math.min(minX, position.x - halfWidth);
          minY = Math.min(minY, position.y - halfHeight);
          maxX = Math.max(maxX, position.x + halfWidth);
          maxY = Math.max(maxY, position.y + halfHeight);
          hasContent = true;
        });
      }

      // Also include elements in bounds
      if (canvasSceneData?.elements) {
        Object.values(canvasSceneData.elements).forEach((element: any) => {
          if (
            element.type === "seating-section" ||
            element.type === "standing-section"
          ) {
            const scale = element.scale || 1.0;
            const halfWidth = (element.width * scale) / 2;
            const halfHeight = (element.height * scale) / 2;
            minX = Math.min(minX, element.x - halfWidth);
            minY = Math.min(minY, element.y - halfHeight);
            maxX = Math.max(maxX, element.x + halfWidth);
            maxY = Math.max(maxY, element.y + halfHeight);
            hasContent = true;
          } else if (
            element.type === "path" &&
            element.points &&
            element.points.length > 0
          ) {
            element.points.forEach((point: any) => {
              minX = Math.min(minX, point.x);
              minY = Math.min(minY, point.y);
              maxX = Math.max(maxX, point.x);
              maxY = Math.max(maxY, point.y);
            });
            hasContent = true;
          } else if (element.type === "rectangle" || element.type === "circle") {
            const scale = element.scale || 1.0;
            const halfWidth = (element.width * scale) / 2;
            const halfHeight = (element.height * scale) / 2;
            minX = Math.min(minX, element.x - halfWidth);
            minY = Math.min(minY, element.y - halfHeight);
            maxX = Math.max(maxX, element.x + halfWidth);
            maxY = Math.max(maxY, element.y + halfHeight);
            hasContent = true;
          }
        });
      }

      // Fallback to contentBounds if no content found
      if (
        !hasContent ||
        minX === Infinity ||
        minY === Infinity ||
        maxX === -Infinity ||
        maxY === -Infinity
      ) {
        return contentBounds;
      }

      // Add minimal padding for better visualization (zoomed in view)
      const width = maxX - minX;
      const height = maxY - minY;
      const padding = 0.05; // 5% padding - smaller for more zoomed in preview
      const paddedWidth = width * (1 + padding * 2);
      const paddedHeight = height * (1 + padding * 2);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return {
        minX: centerX - paddedWidth / 2,
        minY: centerY - paddedHeight / 2,
        maxX: centerX + paddedWidth / 2,
        maxY: centerY + paddedHeight / 2,
        width: paddedWidth,
        height: paddedHeight,
      };
    }, [seatMap, canvasSceneData?.elements, contentBounds]);

    // Calculate preview dimensions and scale
    const previewData = useMemo(() => {
      if (!actualBounds || !actualBounds.width || !actualBounds.height)
        return null;
      if (actualBounds.width <= 0 || actualBounds.height <= 0) return null;

      const previewWidth = 280; // Fixed preview width (reduced from 350)
      const previewHeight = 210; // Fixed preview height (reduced from 260)
      const aspectRatio = actualBounds.width / actualBounds.height;

      // Calculate actual preview dimensions maintaining aspect ratio
      let actualWidth = previewWidth;
      let actualHeight = previewWidth / aspectRatio;

      if (actualHeight > previewHeight) {
        actualHeight = previewHeight;
        actualWidth = previewHeight * aspectRatio;
      }

      // Calculate scale to fit content in preview
      const scaleX = actualWidth / actualBounds.width;
      const scaleY = actualHeight / actualBounds.height;
      const scale = Math.min(scaleX, scaleY);

      // Calculate offset to center content in preview
      const offsetX = (previewWidth - actualBounds.width * scale) / 2;
      const offsetY = (previewHeight - actualBounds.height * scale) / 2;

      return {
        width: previewWidth,
        height: previewHeight,
        actualWidth,
        actualHeight,
        scale,
        offsetX,
        offsetY,
        bounds: actualBounds,
      };
    }, [actualBounds]);

    // Calculate viewport rectangle in preview coordinates with throttling
    const viewportRect = useMemo(() => {
      if (!previewData) return null;

      const {
        scale,
        offsetX,
        offsetY,
        bounds,
        width: previewWidth,
        height: previewHeight,
      } = previewData;

      // Convert viewBox coordinates to preview coordinates
      let x = (viewBox.x - bounds.minX) * scale + offsetX;
      let y = (viewBox.y - bounds.minY) * scale + offsetY;
      const width = viewBox.width * scale;
      const height = viewBox.height * scale;

      // Clamp viewport rect to preview bounds for visibility
      const clampedX = Math.max(0, Math.min(x, previewWidth - width));
      const clampedY = Math.max(0, Math.min(y, previewHeight - height));
      const clampedWidth = Math.min(width, previewWidth);
      const clampedHeight = Math.min(height, previewHeight);

      return {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      };
    }, [previewData, viewBox.x, viewBox.y, viewBox.width, viewBox.height]);

    // Handle click on preview to navigate
    const handlePreviewClick = useCallback(
      (e: any) => {
        // Don't navigate if we're dragging the viewport
        if (isDraggingViewport) return;
        if (!previewData || !setViewBox) return;

        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const { scale, offsetX, offsetY, bounds } = previewData;

        // Convert click coordinates to SVG coordinates
        // Account for the viewBox transformation
        const svgX = (clickX - offsetX) / scale + bounds.minX;
        const svgY = (clickY - offsetY) / scale + bounds.minY;

        // Only navigate if click is within content bounds
        if (
          svgX < bounds.minX ||
          svgX > bounds.maxX ||
          svgY < bounds.minY ||
          svgY > bounds.maxY
        ) {
          return;
        }

        // Center viewBox on clicked position
        setViewBox((prev: any) => ({
          ...prev,
          x: svgX - prev.width / 2,
          y: svgY - prev.height / 2,
        }));
      },
      [previewData, setViewBox, isDraggingViewport],
    );

    // Handle drag start on viewport indicator
    const handleViewportDragStart = useCallback(
      (e: any) => {
        e.stopPropagation(); // Prevent preview click handler
        if (!previewData || !viewportRect) return;

        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        setIsDraggingViewport(true);
        setDragStart({ x: startX, y: startY });
        setViewportStart({ x: viewportRect.x, y: viewportRect.y });
      },
      [previewData, viewportRect],
    );

    // Handle drag move
    const handleViewportDragMove = useCallback(
      (e: any) => {
        if (!isDraggingViewport || !previewData || !setViewBox) return;

        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Calculate drag delta in preview coordinates
        const deltaX = currentX - dragStart.x;
        const deltaY = currentY - dragStart.y;

        // Convert delta to SVG coordinates
        const { scale, bounds } = previewData;
        const svgDeltaX = deltaX / scale;
        const svgDeltaY = deltaY / scale;
        void svgDeltaX;
        void svgDeltaY;

        // Calculate new viewport position in preview coordinates
        const newPreviewX = viewportStart.x + deltaX;
        const newPreviewY = viewportStart.y + deltaY;

        // Clamp to preview bounds
        const { width: previewWidth, height: previewHeight } = previewData;
        const clampedPreviewX = Math.max(
          0,
          Math.min(newPreviewX, previewWidth - (viewportRect as any).width),
        );
        const clampedPreviewY = Math.max(
          0,
          Math.min(newPreviewY, previewHeight - (viewportRect as any).height),
        );

        // Convert back to SVG coordinates
        const newSvgX =
          (clampedPreviewX - previewData.offsetX) / scale + bounds.minX;
        const newSvgY =
          (clampedPreviewY - previewData.offsetY) / scale + bounds.minY;

        // Update viewBox
        setViewBox((prev: any) => ({
          ...prev,
          x: newSvgX,
          y: newSvgY,
        }));
      },
      [
        isDraggingViewport,
        previewData,
        dragStart,
        viewportStart,
        viewportRect,
        setViewBox,
      ],
    );

    // Handle drag end
    const handleViewportDragEnd = useCallback(() => {
      setIsDraggingViewport(false);
    }, []);

    // Add global mouse move and mouse up listeners for dragging
    useEffect(() => {
      if (isDraggingViewport) {
        const handleMouseMove = (e: any) => {
          handleViewportDragMove(e);
        };

        const handleMouseUp = () => {
          handleViewportDragEnd();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDraggingViewport, handleViewportDragMove, handleViewportDragEnd]);

    if (!previewData || !actualBounds) {
      return null;
    }

    const { width, height, scale, offsetX, offsetY, bounds } = previewData;

    const hasSeats = useMemo(() => {
      if (!seatMap) return false;
      const seatCount = Object.keys(seatMap).length;
      return seatCount > 0;
    }, [seatMap]);

    const hasBoundaryPaths = useMemo(() => {
      if (!canvasSceneData?.elements) return false;
      return Object.values(canvasSceneData.elements).some(
        (element: any) => element.type === "path" && element.label === "Boundary",
      );
    }, [canvasSceneData?.elements]);

    const previewSeats = useMemo(() => {
      if (!hasSeats || !previewData) {
        console.log("[SeatPreview] No seats or preview data available");
        return [];
      }

      const {
        scale,
        offsetX,
        offsetY,
        bounds,
        width: previewWidth,
        height: previewHeight,
      } = previewData;

      console.log("[SeatPreview] Preview calculation starting:", {
        totalSeats: Object.keys(seatMap).length,
        scale,
        bounds,
        previewDimensions: { width: previewWidth, height: previewHeight },
        hasBoundaryPaths,
      });

      const config = {
        minSize: 2,
        maxSize: 4,
        sizeMultiplier: 1.0,
        gridSize: 2,
        shape: "circle",
      };

      const allSeats: any[] = [];
      const seatsByRow = new Map();

      Object.entries(seatMap).forEach(([seatId, seat]: any) => {
        const { position, dimensions } = seat;
        const seatWidth = dimensions?.width || 20;
        const seatHeight = dimensions?.height || 20;

        const previewX = (position.x - bounds.minX) * scale + offsetX;
        const previewY = (position.y - bounds.minY) * scale + offsetY;

        if (
          previewX >= -10 &&
          previewX <= previewWidth + 10 &&
          previewY >= -10 &&
          previewY <= previewHeight + 10
        ) {
          const seatColor = getSeatColor ? getSeatColor(seat) : "#cccccc";
          const isSelected = selectedSeats?.has(seat.sl_id) || false;

          const baseSize = Math.min(seatWidth, seatHeight) || 20;
          const scaledSize = baseSize * scale;
          const previewSize = Math.max(
            config.minSize,
            Math.min(config.maxSize, scaledSize * config.sizeMultiplier),
          );

          const seatData = {
            id: seatId,
            x: previewX,
            y: previewY,
            svgX: position.x,
            svgY: position.y,
            color: seatColor,
            size: previewSize,
            width: hasBoundaryPaths
              ? previewSize
              : Math.max(2.5, Math.min(6, seatWidth * scale * 0.95)),
            height: hasBoundaryPaths
              ? previewSize
              : Math.max(2.5, Math.min(5, seatHeight * scale * 0.95)),
            isSelected,
            shape: config.shape,
          };

          allSeats.push(seatData);

          const rowKey = Math.round(previewY / 5) * 5;
          if (!seatsByRow.has(rowKey)) {
            seatsByRow.set(rowKey, []);
          }
          seatsByRow.get(rowKey).push(seatData);
        }
      });

      let avgSeatSpacingX = 30;
      let avgSeatSpacingY = 30;

      if (seatsByRow.size > 0) {
        const spacingsX: number[] = [];
        const spacingsY: number[] = [];

        seatsByRow.forEach((rowSeats: any[]) => {
          if (rowSeats.length > 1) {
            const sorted = [...rowSeats].sort((a, b) => a.svgX - b.svgX);
            for (let i = 1; i < sorted.length; i++) {
              const spacing = Math.abs(sorted[i].svgX - sorted[i - 1].svgX);
              if (spacing > 0 && spacing < 100) {
                spacingsX.push(spacing);
              }
            }
          }
        });

        const rowYPositions = Array.from(seatsByRow.keys()).sort(
          (a: any, b: any) => a - b,
        );
        for (let i = 1; i < rowYPositions.length; i++) {
          const row1 = seatsByRow.get(rowYPositions[i - 1]);
          const row2 = seatsByRow.get(rowYPositions[i]);
          if (row1.length > 0 && row2.length > 0) {
            const spacing = Math.abs(row2[0].svgY - row1[0].svgY);
            if (spacing > 0 && spacing < 100) {
              spacingsY.push(spacing);
            }
          }
        }

        if (spacingsX.length > 0) {
          spacingsX.sort((a, b) => a - b);
          avgSeatSpacingX = spacingsX[Math.floor(spacingsX.length / 2)];
        }
        if (spacingsY.length > 0) {
          spacingsY.sort((a, b) => a - b);
          avgSeatSpacingY = spacingsY[Math.floor(spacingsY.length / 2)];
        }
      }

      const previewSpacingX = avgSeatSpacingX * scale;
      const previewSpacingY = avgSeatSpacingY * scale;

      const adaptiveGridSize = Math.max(
        config.gridSize,
        Math.min(previewSpacingX, previewSpacingY) * 0.7,
      );

      const seats: any[] = [];
      const occupiedGrid = new Map();

      allSeats.sort((a, b) => a.y - b.y || a.x - b.x);

      allSeats.forEach((seat) => {
        const gridX = Math.floor(seat.x / adaptiveGridSize);
        const gridY = Math.floor(seat.y / adaptiveGridSize);
        const gridKey = `${gridX},${gridY}`;

        if (!occupiedGrid.has(gridKey)) {
          occupiedGrid.set(gridKey, true);
          seats.push(seat);
        }
      });

      return seats;
    }, [hasSeats, hasBoundaryPaths, seatMap, previewData, getSeatColor, selectedSeats]);

    const previewElements = useMemo(() => {
      if (!canvasSceneData?.elements || !previewData) return [];

      const { scale, offsetX, offsetY, bounds, width, height } = previewData;
      const elements: any[] = [];

      Object.entries(canvasSceneData.elements).forEach(([elementId, element]: any) => {
        if (element.type === "text") {
          const x = (element.x - bounds.minX) * scale + offsetX;
          const y = (element.y - bounds.minY) * scale + offsetY;
          const fontSize = (element.fontSize || 12) * scale;

          if (fontSize >= 6 && element.text) {
            elements.push({
              type: "text",
              id: elementId,
              x,
              y,
              text: element.text,
              fontSize,
              fillColor: element.fillColor || "#000000",
              textAlign: element.textAlign || "center",
              rotation: element.rotation || 0,
            });
          }
        } else if (element.type === "rectangle") {
          const scaleFactor = element.scale || 1.0;
          const x = (element.x - bounds.minX) * scale + offsetX;
          const y = (element.y - bounds.minY) * scale + offsetY;
          const rectWidth = element.width * scaleFactor * scale;
          const rectHeight = element.height * scaleFactor * scale;

          elements.push({
            type: "elementRect",
            id: elementId,
            x: x - rectWidth / 2,
            y: y - rectHeight / 2,
            width: rectWidth,
            height: rectHeight,
            fillColor: element.fillColor || "#ffffff",
            strokeColor: element.strokeColor || "#d1d5db",
            borderRadius: element.borderRadius ? element.borderRadius * scale : 0,
            label: element.label || element.text,
            labelX: element.labelX || 0,
            labelY: element.labelY || 0,
            labelFontSize: element.fontSize || 12,
            rotation: element.rotation || 0,
            elementX: element.x,
            elementY: element.y,
          });
        } else if (element.type === "circle") {
          const scaleFactor = element.scale || 1.0;
          const x = (element.x - bounds.minX) * scale + offsetX;
          const y = (element.y - bounds.minY) * scale + offsetY;
          const radius =
            (element.radius ||
              Math.min(element.width, element.height) / 2) *
            scaleFactor *
            scale;

          elements.push({
            type: "circle",
            id: elementId,
            cx: x,
            cy: y,
            r: radius,
            fillColor: element.fillColor || "#ffffff",
            strokeColor: element.strokeColor || "#d1d5db",
          });
        } else if (element.type === "path" && element.points && element.label === "Boundary") {
          const centerX =
            element.points.reduce((sum: number, p: any) => sum + p.x, 0) /
            element.points.length;
          const centerY =
            element.points.reduce((sum: number, p: any) => sum + p.y, 0) /
            element.points.length;
          const elementScale = element.scale || 1.0;

          const scaledPoints = element.points
            .map((point: any) => {
              let adjustedX = point.x;
              let adjustedY = point.y;

              if (elementScale !== 1.0) {
                adjustedX = centerX + (point.x - centerX) * elementScale;
                adjustedY = centerY + (point.y - centerY) * elementScale;
              }

              const x = (adjustedX - bounds.minX) * scale + offsetX;
              const y = (adjustedY - bounds.minY) * scale + offsetY;
              return { x, y };
            })
            .filter(
              (p: any) =>
                p.x >= -10 && p.x <= width + 10 && p.y >= -10 && p.y <= height + 10,
            );

          if (scaledPoints.length >= 2) {
            let pathData = `M ${scaledPoints[0].x} ${scaledPoints[0].y}`;

            if (element.curveHandles && Object.keys(element.curveHandles).length > 0) {
              for (let i = 1; i < scaledPoints.length; i++) {
                const segmentIndex = i - 1;
                const segmentHandles = element.curveHandles[segmentIndex];

                if (segmentHandles && segmentHandles.cp1 && segmentHandles.cp2) {
                  let cp1X = segmentHandles.cp1.x;
                  let cp1Y = segmentHandles.cp1.y;
                  let cp2X = segmentHandles.cp2.x;
                  let cp2Y = segmentHandles.cp2.y;

                  if (elementScale !== 1.0) {
                    cp1X = centerX + (segmentHandles.cp1.x - centerX) * elementScale;
                    cp1Y = centerY + (segmentHandles.cp1.y - centerY) * elementScale;
                    cp2X = centerX + (segmentHandles.cp2.x - centerX) * elementScale;
                    cp2Y = centerY + (segmentHandles.cp2.y - centerY) * elementScale;
                  }

                  const cp1PreviewX = (cp1X - bounds.minX) * scale + offsetX;
                  const cp1PreviewY = (cp1Y - bounds.minY) * scale + offsetY;
                  const cp2PreviewX = (cp2X - bounds.minX) * scale + offsetX;
                  const cp2PreviewY = (cp2Y - bounds.minY) * scale + offsetY;

                  pathData += ` C ${cp1PreviewX} ${cp1PreviewY} ${cp2PreviewX} ${cp2PreviewY} ${scaledPoints[i].x} ${scaledPoints[i].y}`;
                } else {
                  pathData += ` L ${scaledPoints[i].x} ${scaledPoints[i].y}`;
                }
              }
            } else if (scaledPoints.length > 3) {
              for (let i = 1; i < scaledPoints.length - 1; i++) {
                const xc = (scaledPoints[i].x + scaledPoints[i + 1].x) / 2;
                const yc = (scaledPoints[i].y + scaledPoints[i + 1].y) / 2;
                pathData += ` Q ${scaledPoints[i].x} ${scaledPoints[i].y} ${xc} ${yc}`;
              }
              if (scaledPoints.length > 1) {
                const lastPoint = scaledPoints[scaledPoints.length - 1];
                const secondLastPoint = scaledPoints[scaledPoints.length - 2];
                pathData += ` Q ${secondLastPoint.x} ${secondLastPoint.y} ${lastPoint.x} ${lastPoint.y}`;
              }
            } else {
              for (let i = 1; i < scaledPoints.length; i++) {
                pathData += ` L ${scaledPoints[i].x} ${scaledPoints[i].y}`;
              }
            }

            if (scaledPoints.length > 2) {
              pathData += " Z";
            }

            elements.push({
              type: "path",
              id: elementId,
              pathData,
              strokeColor: element.strokeColor || "#6b7280",
              strokeWidth: element.strokeWidth || 2,
            });
          }
        } else if (element.type === "seating-section" || element.type === "standing-section") {
          if (element.pathBoundary && element.pathBoundary.points && element.pathBoundary.points.length > 0) {
            const points = element.pathBoundary.points;
            const curveHandles = element.pathBoundary.curveHandles || {};

            const transformedPoints = points
              .map((point: any) => {
                const x = (point.x - bounds.minX) * scale + offsetX;
                const y = (point.y - bounds.minY) * scale + offsetY;
                return { x, y };
              })
              .filter(
                (p: any) =>
                  p.x >= -10 && p.x <= width + 10 && p.y >= -10 && p.y <= height + 10,
              );

            if (transformedPoints.length >= 2) {
              let pathData = `M ${transformedPoints[0].x} ${transformedPoints[0].y}`;

              if (Object.keys(curveHandles).length > 0) {
                for (let i = 1; i < transformedPoints.length; i++) {
                  const segmentIndex = i - 1;
                  const segmentHandles = curveHandles[segmentIndex];

                  if (segmentHandles && segmentHandles.cp1 && segmentHandles.cp2) {
                    const cp1X = (segmentHandles.cp1.x - bounds.minX) * scale + offsetX;
                    const cp1Y = (segmentHandles.cp1.y - bounds.minY) * scale + offsetY;
                    const cp2X = (segmentHandles.cp2.x - bounds.minX) * scale + offsetX;
                    const cp2Y = (segmentHandles.cp2.y - bounds.minY) * scale + offsetY;
                    pathData += ` C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${transformedPoints[i].x} ${transformedPoints[i].y}`;
                  } else {
                    pathData += ` L ${transformedPoints[i].x} ${transformedPoints[i].y}`;
                  }
                }
              } else {
                for (let i = 1; i < transformedPoints.length; i++) {
                  pathData += ` L ${transformedPoints[i].x} ${transformedPoints[i].y}`;
                }
              }

              if (transformedPoints.length > 2) {
                pathData += " Z";
              }

              elements.push({
                type: "sectionPath",
                id: elementId,
                pathData,
                fillColor: element.fillColor || "#bfdbfe",
                strokeColor: element.strokeColor || "#3b82f6",
                label: element.sectionName || element.label,
                labelX: element.labelX || 0,
                labelY: element.labelY || 0,
                labelFontSize: element.labelFontSize || 12,
                labelRotation: element.labelRotation,
                rotation: element.rotation || 0,
                x: element.x,
                y: element.y,
                hasSeats,
              });
            }
          } else {
            const scaleFactor = element.scale || 1.0;
            const x = (element.x - bounds.minX) * scale + offsetX;
            const y = (element.y - bounds.minY) * scale + offsetY;
            const rectWidth = element.width * scaleFactor * scale;
            const rectHeight = element.height * scaleFactor * scale;

            elements.push({
              type: "rect",
              id: elementId,
              x: x - rectWidth / 2,
              y: y - rectHeight / 2,
              width: rectWidth,
              height: rectHeight,
              fillColor: element.fillColor || "#bfdbfe",
              strokeColor: element.strokeColor || "#3b82f6",
              borderRadius: element.borderRadius ? element.borderRadius * scale : 0,
              label: element.sectionName || element.label,
              labelX: element.labelX || 0,
              labelY: element.labelY || 0,
              labelFontSize: element.labelFontSize || 12,
              labelRotation: element.labelRotation,
              rotation: element.rotation || 0,
              elementX: element.x,
              elementY: element.y,
              hasSeats,
            });
          }
        }
      });

      return elements;
    }, [canvasSceneData?.elements, previewData, hasSeats]);

    return (
      <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handlePreviewClick}
          style={{ display: "block" }}
          // title="Click to navigate to that area"
        >
          <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

          {previewElements.map((element: any) => {
            if (element.type === "path") {
              return (
                <path
                  key={element.id}
                  d={element.pathData}
                  fill="none"
                  stroke={element.strokeColor || "#6b7280"}
                  strokeWidth={Math.max(0.5, (element.strokeWidth || 2) * scale)}
                  opacity={0.5}
                />
              );
            } else if (element.type === "sectionPath") {
              const labelX =
                (element.x - bounds.minX) * scale +
                offsetX +
                (element.labelX || 0) * scale;
              const labelY =
                (element.y - bounds.minY) * scale +
                offsetY +
                (element.labelY || 0) * scale;
              const fontSize = (element.labelFontSize || 12) * scale;

              return (
                <g key={element.id}>
                  <path
                    d={element.pathData}
                    fill={element.hasSeats ? "none" : element.fillColor || "#bfdbfe"}
                    stroke={element.strokeColor || "#3b82f6"}
                    strokeWidth={element.hasSeats ? 1 : 0}
                    opacity={element.hasSeats ? 0.6 : 1.0}
                  />
                  {element.label && fontSize >= 6 && (
                    <text
                      x={labelX}
                      y={labelY}
                      fill="#000000"
                      fontSize={fontSize}
                      fontFamily="Arial"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={1.0}
                      transform={
                        element.labelRotation
                          ? `rotate(${(element.labelRotation * 180) / Math.PI} ${labelX} ${labelY})`
                          : element.rotation
                            ? `rotate(${(element.rotation * 180) / Math.PI} ${labelX} ${labelY})`
                            : undefined
                      }
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {element.label}
                    </text>
                  )}
                </g>
              );
            } else if (element.type === "rect") {
              const labelX =
                (element.elementX - bounds.minX) * scale +
                offsetX +
                (element.labelX || 0) * scale;
              const labelY =
                (element.elementY - bounds.minY) * scale +
                offsetY +
                (element.labelY || 0) * scale;
              const fontSize = (element.labelFontSize || 12) * scale;

              return (
                <g key={element.id}>
                  <rect
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.hasSeats ? "none" : element.fillColor || "#bfdbfe"}
                    stroke={element.strokeColor || "#3b82f6"}
                    strokeWidth={element.hasSeats ? 1 : 0}
                    opacity={element.hasSeats ? 0.6 : 1.0}
                    rx={element.borderRadius}
                    ry={element.borderRadius}
                  />
                  {element.label && fontSize >= 6 && (
                    <text
                      x={labelX}
                      y={labelY}
                      fill="#000000"
                      fontSize={fontSize}
                      fontFamily="Arial"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={1.0}
                      transform={
                        element.labelRotation
                          ? `rotate(${(element.labelRotation * 180) / Math.PI} ${labelX} ${labelY})`
                          : element.rotation
                            ? `rotate(${(element.rotation * 180) / Math.PI} ${labelX} ${labelY})`
                            : undefined
                      }
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {element.label}
                    </text>
                  )}
                </g>
              );
            } else if (element.type === "elementRect") {
              const labelX =
                (element.elementX - bounds.minX) * scale +
                offsetX +
                (element.labelX || 0) * scale;
              const labelY =
                (element.elementY - bounds.minY) * scale +
                offsetY +
                (element.labelY || 0) * scale;
              const fontSize = (element.labelFontSize || 12) * scale;

              return (
                <g key={element.id}>
                  <rect
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fillColor || "#ffffff"}
                    stroke="none"
                    opacity={1.0}
                    rx={element.borderRadius}
                    ry={element.borderRadius}
                    transform={
                      element.rotation
                        ? `rotate(${(element.rotation * 180) / Math.PI} ${element.x + element.width / 2
                        } ${element.y + element.height / 2})`
                        : undefined
                    }
                  />
                  {element.label && fontSize >= 6 && (
                    <text
                      x={labelX}
                      y={labelY}
                      fill="#000000"
                      fontSize={fontSize}
                      fontFamily="Arial"
                      fontWeight="normal"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={1.0}
                      transform={
                        element.rotation
                          ? `rotate(${(element.rotation * 180) / Math.PI} ${labelX} ${labelY})`
                          : undefined
                      }
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {element.label}
                    </text>
                  )}
                </g>
              );
            } else if (element.type === "circle") {
              return (
                <circle
                  key={element.id}
                  cx={element.cx}
                  cy={element.cy}
                  r={element.r}
                  fill={element.fillColor || "#ffffff"}
                  stroke="none"
                  opacity={1.0}
                />
              );
            } else if (element.type === "text") {
              return (
                <text
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  fill={element.fillColor || "#000000"}
                  fontSize={element.fontSize}
                  fontFamily="Arial"
                  fontWeight="normal"
                  textAnchor={element.textAlign === "center" ? "middle" : "start"}
                  dominantBaseline="middle"
                  opacity={1.0}
                  transform={
                    element.rotation
                      ? `rotate(${(element.rotation * 180) / Math.PI} ${element.x} ${element.y})`
                      : undefined
                  }
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {element.text}
                </text>
              );
            }
            return null;
          })}

          {previewSeats.length > 0 &&
            previewSeats.map((seat: any) =>
              seat.shape === "rect" ? (
                <rect
                  key={seat.id}
                  x={seat.x - seat.width / 2}
                  y={seat.y - seat.height / 2}
                  width={seat.width}
                  height={seat.height}
                  rx={0.5}
                  ry={0.5}
                  fill={seat.color}
                  stroke={seat.isSelected ? "#000000" : "rgba(0,0,0,0.2)"}
                  strokeWidth={seat.isSelected ? 0.5 : 0.25}
                  opacity={1.0}
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <circle
                  key={seat.id}
                  cx={seat.x}
                  cy={seat.y}
                  r={seat.size}
                  fill={seat.color}
                  stroke={seat.isSelected ? "#000000" : "none"}
                  strokeWidth={seat.isSelected ? 0.5 : 0}
                  opacity={1.0}
                  style={{ pointerEvents: "none" }}
                />
              ),
            )}

          {viewportRect && (
            <g>
              <rect
                x={viewportRect.x}
                y={viewportRect.y}
                width={viewportRect.width}
                height={viewportRect.height}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity={isDraggingViewport ? 0.9 : 0.8}
                style={{ cursor: "move", pointerEvents: "auto" }}
                onMouseDown={handleViewportDragStart}
              />
              {viewportRect.width > 20 && viewportRect.height > 20 && (
                <>
                  <circle
                    cx={viewportRect.x}
                    cy={viewportRect.y}
                    r="2.5"
                    fill="#3b82f6"
                    opacity={isDraggingViewport ? 0.9 : 0.8}
                    style={{ cursor: "move", pointerEvents: "auto" }}
                    onMouseDown={handleViewportDragStart}
                  />
                  <circle
                    cx={viewportRect.x + viewportRect.width}
                    cy={viewportRect.y}
                    r="2.5"
                    fill="#3b82f6"
                    opacity={isDraggingViewport ? 0.9 : 0.8}
                    style={{ cursor: "move", pointerEvents: "auto" }}
                    onMouseDown={handleViewportDragStart}
                  />
                  <circle
                    cx={viewportRect.x}
                    cy={viewportRect.y + viewportRect.height}
                    r="2.5"
                    fill="#3b82f6"
                    opacity={isDraggingViewport ? 0.9 : 0.8}
                    style={{ cursor: "move", pointerEvents: "auto" }}
                    onMouseDown={handleViewportDragStart}
                  />
                  <circle
                    cx={viewportRect.x + viewportRect.width}
                    cy={viewportRect.y + viewportRect.height}
                    r="2.5"
                    fill="#3b82f6"
                    opacity={isDraggingViewport ? 0.9 : 0.8}
                    style={{ cursor: "move", pointerEvents: "auto" }}
                    onMouseDown={handleViewportDragStart}
                  />
                </>
              )}
            </g>
          )}
        </svg>

        {hasSeats && (
          <div className="absolute bottom-1 right-1 bg-gray-800/80 text-white text-xs px-1.5 py-0.5 rounded">
            {Object.keys(seatMap).length} seats
          </div>
        )}
      </div>
    );
  },
  (prevProps: any, nextProps: any) => {
    const viewBoxChanged =
      prevProps.viewBox.x !== nextProps.viewBox.x ||
      prevProps.viewBox.y !== nextProps.viewBox.y ||
      prevProps.viewBox.width !== nextProps.viewBox.width ||
      prevProps.viewBox.height !== nextProps.viewBox.height;

    const otherPropsChanged =
      prevProps.contentBounds !== nextProps.contentBounds ||
      prevProps.seatMap !== nextProps.seatMap ||
      prevProps.canvasSceneData !== nextProps.canvasSceneData ||
      prevProps.selectedSeats !== nextProps.selectedSeats;

    return !viewBoxChanged && !otherPropsChanged;
  },
);

SeatPreview.displayName = "SeatPreview";

export default SeatPreview;

