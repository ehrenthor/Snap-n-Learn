import React, { forwardRef } from 'react';
import './CaptionRenderer.css';

/**
 * Parses a caption string containing <mark id="..."> tags and renders it,
 * making the marked segments clickable. When a marked segment is clicked,
 * it invokes the onMarkClick callback with the corresponding ID.
 *
 * We now forward the ref so TextHighlighter can measure the <p>’s text.
 */
const CaptionRenderer = forwardRef(({ caption, onMarkClick = () => {} }, ref) => {
  const regex = /<mark id="([^"]+)">([^<]+)<\/mark>/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(caption)) !== null) {
    if (match.index > lastIndex) {
      parts.push(caption.substring(lastIndex, match.index));
    }
    const id   = match[1];
    const text = match[2];
    parts.push(
      <span
        key={`mark-${id}-${match.index}`}
        className="caption-mark"
        onClick={e => {
          e.stopPropagation();
          onMarkClick(id);
        }}
        tabIndex={0}
      >
        {text}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < caption.length) {
    parts.push(caption.substring(lastIndex));
  }

  // Attach the forwarded ref here:
  return (
    <p ref={ref} className="childUploadImage-caption-text">
      {parts}
    </p>
  );
});

export default CaptionRenderer;