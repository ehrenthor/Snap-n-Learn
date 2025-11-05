import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { useTextHighlighter } from "../hooks/useTextHighlighter";
const apiUrl = process.env.REACT_APP_API_URL;

const TextHighlighter = ({ children }) => {
  const { selection, fullText, overlayPosition, containerRef, textRef, setSelection } = useTextHighlighter();
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  // Cache to store previous explanations
  const [explanationCache, setExplanationCache] = useState({});

  // Clone the child element to add the ref
  const childWithRef = React.cloneElement(React.Children.only(children), {
    ref: textRef
  });

  // Create a cache key that includes both the text and its position
  const createCacheKey = useCallback((text, position) => {
    if (!text || !position) return null;
    // Include text and position in the key to differentiate same text at different locations
    return `${text}__${position.top}_${position.left}`;
  }, []);

  // Check cache for existing explanation
  useEffect(() => {
    if (selection && overlayPosition) {
      const cacheKey = createCacheKey(selection, overlayPosition);
      if (cacheKey && explanationCache[cacheKey]) {
        setExplanation(explanationCache[cacheKey]);
      } else {
        // Reset explanation when new text is selected
        setExplanation(null);
      }
    }
  }, [selection, overlayPosition, explanationCache, createCacheKey]);

  const fetchExplanation = async () => {
    if (!selection) return;
    setLoading(true);

    try {
      // Check cache first
      const cacheKey = createCacheKey(selection, overlayPosition);
      if (cacheKey && explanationCache[cacheKey]) {
        setExplanation(explanationCache[cacheKey]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/chat/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          selectedText: selection,
          caption: fullText.replace(/<[^>]+>/g, ''),
        }),
      });

      const data = await response.json();
      const newExplanation = data.explanation;
      setExplanation(newExplanation);

      // Save to cache
      if (cacheKey) {
        setExplanationCache(prevCache => ({
          ...prevCache,
          [cacheKey]: newExplanation
        }));
      }
    } catch (error) {
      setExplanation("Failed to fetch explanation.");
    } finally {
      setLoading(false);
    }
  };

  // Handle closing the popup
  const handleClose = () => {
    setSelection(null);
    // We don't reset explanation here, as it will be reset when a new selection is made
  };

  // Create overlay element
  const renderOverlay = () => {
    if (!selection || !overlayPosition) return null;

    const overlayStyle = {
      position: "fixed",
      top: `${overlayPosition.top}px`,
      left: `${overlayPosition.left}px`,
      background: "white",
      border: "1px solid #ccc",
      padding: "8px",
      borderRadius: "4px",
      boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
      zIndex: 1000,
      maxWidth: "300px",
    };

    return ReactDOM.createPortal(
      <div style={overlayStyle}>
        {explanation ? (
          <div>
            <strong>Explanation:</strong>
            <p style={{ margin: "5px 0" }}>{explanation}</p>
            <button
              onClick={handleClose}
              style={{ padding: "4px 8px", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        ) : (
          <button
            onClick={fetchExplanation}
            disabled={loading}
            style={{ padding: "4px 8px", cursor: "pointer" }}
          >
            {loading ? "Loading..." : "Explain"}
          </button>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {childWithRef}
      {renderOverlay()}
    </div>
  );
};

export default TextHighlighter;