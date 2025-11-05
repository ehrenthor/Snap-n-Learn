import React, { useState, useRef, useEffect, useMemo } from 'react';
import './ImageHighlighter.css';

const ImageHighlighter = ({
                            imageSrc,
                            boundingBoxes,
                            onBoxHover = () => {
                            },
                            onBoxLeave = () => {
                            },
                            onBoxClick = () => {
                            }, externallyHighlightedId = null
                          }) => {
  const [hoveredBoxes, setHoveredBoxes] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Generate a consistent color for each unique object label
  const getColorForLabel = (label) => {
    const hash = Array.from(label).reduce(
      (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
    );
    const hue = hash % 360;
    return `hsla(${hue}, 80%, 50%, 0.3)`;
  };

  // Handle image load to get actual displayed dimensions and natural dimensions
  useEffect(() => {
    if (imageRef.current) {
      const updateImageSize = () => {
        if (imageRef.current) {
          setImageSize({
            width: imageRef.current.clientWidth,
            height: imageRef.current.clientHeight
          });

          // Store the natural (intrinsic) size of the image
          setImageNaturalSize({
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight
          });
        }
      };

      // Initial size calculation
      if (imageRef.current.complete) {
        updateImageSize();
      } else {
        imageRef.current.onload = updateImageSize;
      }

      // Update on window resize
      window.addEventListener('resize', updateImageSize);

      return () => {
        window.removeEventListener('resize', updateImageSize);
      };
    }
  }, [imageSrc]);

  // Convert backend coordinates to actual image display coordinates
  const scaleCoordinates = (bbox) => {
    const [x1, y1, x2, y2] = bbox;

    // Get the actual display dimensions of the image
    const displayWidth = imageSize.width;
    const displayHeight = imageSize.height;

    // Get the natural dimensions of the image
    const naturalWidth = imageNaturalSize.width;
    const naturalHeight = imageNaturalSize.height;

    // Calculate the backend dimensions using the new logic where
    // images are ALWAYS scaled so the larger dimension is exactly 1024px
    let backendWidth, backendHeight;
    const backendTargetDimension = 1024;

    // Find the larger dimension to determine scaling factor
    const maxNaturalDimension = Math.max(naturalWidth, naturalHeight);

    // Calculate the scale factor to convert natural dimensions to backend dimensions
    const scaleFactor = backendTargetDimension / maxNaturalDimension;

    // Apply the scale factor to both dimensions
    backendWidth = naturalWidth * scaleFactor;
    backendHeight = naturalHeight * scaleFactor;

    // Now calculate scale factors to go from backend dimensions to display dimensions
    const scaleX = displayWidth / backendWidth;
    const scaleY = displayHeight / backendHeight;

    // Use the smaller scale for both dimensions to preserve aspect ratio
    const scale = Math.min(scaleX, scaleY);

    // Calculate offsets for letterboxing
    const horizontalOffset = (displayWidth - (backendWidth * scale)) / 2;
    const verticalOffset = (displayHeight - (backendHeight * scale)) / 2;

    return {
      left: (x1 * scale) + horizontalOffset,
      top: (y1 * scale) + verticalOffset,
      width: (x2 - x1) * scale,
      height: (y2 - y1) * scale
    };
  };

  // Check if mouse is over a bounding box
  const handleMouseMove = (e) => {
    if (!containerRef.current || !imageSize.width || !boundingBoxes) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find all boxes under the cursor
    const currentHovered = boundingBoxes.filter(box => {
      // Ensure box and box.bbox_2d exist before scaling
      if (!box || !box.bbox_2d) return false;
      const { left, top, width, height } = scaleCoordinates(box.bbox_2d);
      return (
        mouseX >= left &&
        mouseX <= left + width &&
        mouseY >= top &&
        mouseY <= top + height
      );
    });

    // Check if the set of hovered boxes has changed
    const currentHoveredIds = new Set(currentHovered.map(b => b.id));
    const previousHoveredIds = new Set(hoveredBoxes.map(b => b.id));

    if (currentHoveredIds.size !== previousHoveredIds.size || ![...currentHoveredIds].every(id => previousHoveredIds.has(id))) {
      // Trigger leave for boxes no longer hovered
      hoveredBoxes.forEach(box => {
        if (!currentHoveredIds.has(box.id)) {
          onBoxLeave(box);
        }
      });
      // Trigger hover for newly hovered boxes
      currentHovered.forEach(box => {
        if (!previousHoveredIds.has(box.id)) {
          onBoxHover(box);
        }
      });
      // Update the state
      setHoveredBoxes(currentHovered);
    }
  };

  // Handle mouse leaving the container
  const handleMouseLeave = () => {
    if (hoveredBoxes.length > 0) {
      hoveredBoxes.forEach(box => onBoxLeave(box));
      setHoveredBoxes([]);
    }
  };

  // Memoize the list of unique labels to avoid recalculating on every render
  const uniqueLabels = useMemo(() => {
    if (!boundingBoxes) return [];
    // Ensure box.object exists and filter out empty/null labels before creating the Set
    const labels = boundingBoxes.map(box => box?.object).filter(label => label);
    return Array.from(new Set(labels));
  }, [boundingBoxes]);

  // Memoize the set of currently active object labels for efficient lookup
  const activeLabels = useMemo(() => {
    // Determine which full box objects are active (hovered or external)
    const activeBoxes = boundingBoxes?.filter(box =>
      hoveredBoxes.some(hb => hb.id === box.id) || String(box?.id) === String(externallyHighlightedId)
    ) || [];
    // Extract the 'object' property from these active boxes into a Set
    return new Set(activeBoxes.map(box => box.object));
  }, [boundingBoxes, hoveredBoxes, externallyHighlightedId]);


  // Determine which boxes should show labels (hovered or externally highlighted)
  const boxesToShowLabel = boundingBoxes.filter(box =>
    hoveredBoxes.some(hb => hb.id === box.id) || String(box.id) === String(externallyHighlightedId)
  );

  return (
    <div className="imageHighlighter-container">
      <div
        ref={containerRef}
        className="imageHighlighter-image-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Analyzed content"
          className="imageHighlighter-image"
          onLoad={() => {
            if (imageRef.current) {
              setImageSize({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight
              });
              setImageNaturalSize({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight
              });
            }
          }}
        />
        {/* Render bounding box overlays */}
        {boundingBoxes && boundingBoxes.map((box) => {
          if (!box || !box.bbox_2d || box.id === undefined || box.id === null) {
            console.warn('Skipping invalid bounding box data:', box);
            return null;
          }

          const { left, top, width, height } = scaleCoordinates(box.bbox_2d);
          const isHovered = hoveredBoxes.some(hb => hb.id === box.id);
          const isExternallyHighlighted = String(box.id) === String(externallyHighlightedId);
          const isActive = isHovered || isExternallyHighlighted;
          const boxColor = getColorForLabel(box.object);

          // Ensure dimensions are non-negative before rendering
          if (width <= 0 || height <= 0) {
            return null;
          }

          return (
            <div
              key={box.id}
              className={`imageHighlighter-bounding-box ${isActive ? 'imageHighlighter-active' : ''}`}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: isActive ? boxColor : 'transparent',
                borderColor: boxColor.replace('0.3', '0.8') // Make border more opaque
              }}
              onClick={() => onBoxClick(box)}
            />
          );
        })}
      </div>
      {/* Render the container if there are any unique labels to potentially display */}
      {uniqueLabels.length > 0 && (
        <div className="imageHighlighter-label-container">
          {uniqueLabels.map((label, index) => {
            // Check if this specific label corresponds to any currently active box
            const isActive = activeLabels.has(label);
            return ( isActive &&
              <div
                key={index}
                className="imageHighlighter-label-item"
                style={{
                  // Apply visual styles only if active
                  backgroundColor: isActive ? getColorForLabel(label).replace('0.3', '0.7') : 'transparent',
                  color: isActive ? 'white' : 'transparent',
                  visibility: isActive ? 'visible' : 'hidden',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageHighlighter;