import { useState, useEffect, useRef } from "react";

export const useTextHighlighter = () => {
  const [selection, setSelection] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState(null);
  const [fullText, setFullText] = useState("");
  const containerRef = useRef(null);
  const textRef = useRef(null); // Reference to the actual text element

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const text = sel.toString().trim();

      // Check if selection is within our container
      if (!text || !containerRef.current?.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      // Get the bounding rectangle of the selection
      const rect = range.getBoundingClientRect();

      // Calculate position relative to the viewport
      setSelection(text);
      setOverlayPosition({
        top: rect.bottom,
        left: rect.right,
      });

      // Capture full text from the text element
      if (textRef.current) {
        setFullText(textRef.current.innerText);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  return { selection, fullText, overlayPosition, containerRef, textRef, setSelection };
};