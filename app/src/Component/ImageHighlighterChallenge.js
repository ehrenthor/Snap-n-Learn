import React, { useState, useRef, useEffect, useMemo } from 'react';
import './ImageHighlighterChallenge.css';

const ImageHighlighterChallenge = ({
                            imageSrc,
                            boundingBoxes,
                            onBoxHover = () => {},
                            onBoxLeave = () => {},
                            onBoxClick = () => {},
                            externallyHighlightedId = null,
                            isChallenge = false,
                          }) => {
  const [hoveredBoxes, setHoveredBoxes] = useState([]);
  const [activeBox, setActiveBox] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const hoverTimeout = useRef(null);

  // Generate color for labels
  const getColorForLabel = (label) => {
    const hash = Array.from(label).reduce((acc, char) =>
      char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return `hsla(${hash % 360}, 80%, 50%, 0.3)`;
  };



  // Image size handling
  useEffect(() => {
    if (!imageRef.current) return;

    const updateSize = () => {
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
    };

    if (imageRef.current.complete) updateSize();
    else imageRef.current.onload = updateSize;

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageSrc]);

  // Coordinate scaling
  const scaleCoordinates = (bbox) => {
    const [x1, y1, x2, y2] = bbox;
    const naturalMax = Math.max(imageNaturalSize.width, imageNaturalSize.height);
    const scale = 1024 / naturalMax;

    const displayWidth = imageSize.width;
    const displayHeight = imageSize.height;
    const scaledWidth = imageNaturalSize.width * scale;
    const scaledHeight = imageNaturalSize.height * scale;

    const ratio = Math.min(displayWidth / scaledWidth, displayHeight / scaledHeight);
    const hOffset = (displayWidth - scaledWidth * ratio) / 2;
    const vOffset = (displayHeight - scaledHeight * ratio) / 2;

    return {
      left: (x1 * scale * ratio) + hOffset,
      top: (y1 * scale * ratio) + vOffset,
      width: (x2 - x1) * scale * ratio,
      height: (y2 - y1) * scale * ratio
    };
  };

  // Mouse move handler
  const handleMouseMove = (e) => {
    if (!containerRef.current || !boundingBoxes) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Create a Set of existing hovered box IDs for quick lookup
    const existingIds = new Set(hoveredBoxes.map(b => b.id));

    // Check existing hovered boxes first
    const stillHovered = hoveredBoxes.filter(box => {
      const { left, top, width, height } = scaleCoordinates(box.bbox_2d);
      return mouseX >= left && mouseX <= left + width &&
        mouseY >= top && mouseY <= top + height;
    });

    // Find new boxes that weren't previously hovered
    const newHovered = boundingBoxes.filter(box => {
      if (!box?.bbox_2d || existingIds.has(box.id)) return false;
      const { left, top, width, height } = scaleCoordinates(box.bbox_2d);
      return mouseX >= left && mouseX <= left + width &&
        mouseY >= top && mouseY <= top + height;
    });

    // Combine maintained and new hovered boxes
    const currentHovered = [...stillHovered, ...newHovered];

    setHoveredBoxes(currentHovered);
    const newActive = currentHovered[currentHovered.length - 1] || null;

    if (activeBox?.id !== newActive?.id) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = setTimeout(() => {
        if (activeBox) onBoxLeave(activeBox);
        setActiveBox(newActive);
        if (newActive) onBoxHover(newActive);
      }, 50);
    }
  };

  // Mouse leave handler
  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHoveredBoxes([]);
    if (activeBox) {
      onBoxLeave(activeBox);
      setActiveBox(null);
    }
  };

  // Active label memoization
  const activeLabel = useMemo(() =>
    activeBox?.object || null, [activeBox]);

  return (
    <div className="imageHighlighterChallenge-container">
      <div
        ref={containerRef}
        className="imageHighlighterChallenge-image-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Analyzed content"
          className="imageHighlighterChallenge-image"
        />

        {boundingBoxes?.map((box) => {
          if (!box?.bbox_2d || box.id == null) return null;

          const { left, top, width, height } = scaleCoordinates(box.bbox_2d);
          if (width <= 0 || height <= 0) return null;

          return (
            <div
              key={box.id}
              className={`imageHighlighterChallenge-bounding-box ${
                activeBox?.id === box.id ? 'imageHighlighterChallenge-active' : ''
              }`}
              style={{
                '--box-color': getColorForLabel(box.object),
                '--border-color': getColorForLabel(box.object).replace('0.3', '0.8'),
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`
              }}
              onClick={() => onBoxClick(box)}
            />
          );
        })}
      </div>

      {activeLabel && !isChallenge && (
        <div className="imageHighlighterChallenge-label-container visible">
          <div
            className="imageHighlighterChallenge-label-item"
            style={{
              backgroundColor: getColorForLabel(activeLabel).replace('0.3', '0.7'),
              color: 'white'
            }}
          >
            {activeLabel}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageHighlighterChallenge;