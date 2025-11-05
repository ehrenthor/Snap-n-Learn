import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ChildHistoryDetailPage.css";
import TextHighlighter from '../../Component/TextHighlighter';
import ImageHighlighter from '../../Component/ImageHighlighter';
import CaptionRenderer from "../../Component/CaptionRenderer";

const apiUrl = process.env.REACT_APP_API_URL;

const ChildHistoryDetailPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chatDetails, setChatDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [highlightedBoxId, setHighlightedBoxId] = useState(null);
  const [objectAudios, setObjectAudios] = useState([]);
  const mainAudioRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Fetch the chat details, including objectAudio
  useEffect(() => {
    const fetchChatDetails = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const resp = await fetch(`${apiUrl}/chat/${chatId}`, {
          method: "GET",
          credentials: "include"
        });
        if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);

        const data = await resp.json();

        // Ensure image has data URL prefix
        if (data.image && !data.image.startsWith('data:image')) {
          data.image = `data:image/jpeg;base64,${data.image}`;
        }

        setChatDetails(data);

        // Grab the new objectAudio array if present
        if (Array.isArray(data.objectAudio)) {
          setObjectAudios(data.objectAudio);
        }

      } catch (err) {
        console.error("Error fetching chat details:", err);
        setErrorMessage(`Failed to load chat details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId]);

  // Stop any playing audio, then play the main story clip
  const playMainAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = 0;
      mainAudioRef.current.play();
      currentAudioRef.current = mainAudioRef.current;
    }
  };

  // Play an individual object's audio and highlight its box
  const playObjectAudio = (objectName, boxId) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    // Find the dataURL for this object
    const entry = objectAudios.find(o => o.object === objectName);
    if (!entry) return;

    const audio = new Audio(entry.audio);
    audio.play();
    currentAudioRef.current = audio;

    // flash‐highlight the box
    setHighlightedBoxId(boxId);
    setTimeout(() => setHighlightedBoxId(null), 1500);
  };

  // Called when a bounding box is clicked
  const handleBoxClick = (box) => {
    playObjectAudio(box.object, box.id);
  };

  // Called when a <mark> in the caption text is clicked
  const handleMarkClick = (markId) => {
    // find the matching box by id
    const box = chatDetails?.bbox?.find(b => String(b.id) === String(markId));
    if (box) {
      playObjectAudio(box.object, box.id);
    }
    // also flash the text mark
    setHighlightedBoxId(markId);
    setTimeout(() => setHighlightedBoxId(null), 1500);
  };

  const handleBoxHover = () => { /* you can keep existing hover logic */
  };

  return (
    <div className="childHistoryDetail-container">
      <button
        className="childHistoryDetail-back-button"
        onClick={() => navigate(-1)}
      >
        ⬅️ Back to history
      </button>

      <h1 className="childHistoryDetail-title">Chat Details</h1>

      {loading && <p className="childHistoryDetail-loading">Loading your memory... ⏳</p>}
      {errorMessage && <p className="childHistoryDetail-error">Oops! {errorMessage}</p>}

      {chatDetails && !loading && (
        <div className="childHistoryDetail-content">
          {/* IMAGE + BOXES */}
          <div className="childHistoryDetail-image-container">
            {chatDetails.image ? (
              <div className="childHistoryDetail-highlighter-wrapper">
                <ImageHighlighter
                  imageSrc={chatDetails.image}
                  boundingBoxes={chatDetails.bbox || []}
                  onBoxHover={handleBoxHover}
                  externallyHighlightedId={highlightedBoxId}
                  onBoxClick={handleBoxClick}            // ← wire up click
                />
              </div>
            ) : (
              <div className="childHistoryDetail-no-image">No image available 🖼️</div>
            )}
          </div>

          {/* CAPTION + AUDIO */}
          <div className="childUploadImage-caption-box">
            <h3 className="childUploadImage-caption-title">
              🎤 Story About Your Picture:
            </h3>

            {chatDetails.caption ? (
              <TextHighlighter>
                <CaptionRenderer
                  caption={chatDetails.caption}
                  onMarkClick={handleMarkClick}         // ← wire up text‐click
                />
              </TextHighlighter>
            ) : (
              <p className="childUploadImage-caption-text">
                No story found for this picture.
              </p>
            )}

            {chatDetails.audio && (
              <div className="childUploadImage-audio-player">
                <button
                  onClick={playMainAudio}               // ← use our wrapper
                  className="childUploadImage-play-button"
                  aria-label="Play story audio"
                >
                  ▶️ Play Story
                </button>
                <audio
                  ref={mainAudioRef}
                  className="childUploadImage-audio-element"
                  preload="metadata"
                  controls
                >
                  <source src={chatDetails.audio} type="audio/mpeg"/>
                  Your browser does not support audio.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildHistoryDetailPage;