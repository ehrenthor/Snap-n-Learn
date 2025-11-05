import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChildUploadImagePage.css';
import { useSocket } from '../../hooks/useSocket';
import TextHighlighter from '../../Component/TextHighlighter';
import ImageHighlighter from '../../Component/ImageHighlighter';
import CaptionRenderer from '../../Component/CaptionRenderer';

const apiUrl = process.env.REACT_APP_API_URL;

const ChildUploadImagePage = () => {
  const navigate = useNavigate();
  const { error, listenForMessages } = useSocket('Child');
  const [canUpload, setCanUpload] = useState(null);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [image, setImage] = useState(null); // Holds the selected/captured image data URL
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showBubble, setShowBubble] = useState(false);
  const [chatWindowVisible, setChatWindowVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const audioRef = useRef(null);
  const currentAudioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [highlightedBoxId, setHighlightedBoxId] = useState(null);
  const [objectAudios, setObjectAudios] = useState([]);

  // --- Camera State ---
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // For capturing the frame

  useEffect(() => {
    const checkUploadPermission = async () => {
      try {
        const res = await fetch(`${apiUrl}/chat/checkCanUpload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok || data.canUpload === false) {
          setCanUpload(false);
          setErrorMessage(data.message || 'You are not allowed to upload images.');
        } else {
          setCanUpload(true);
        }
      } catch (err) {
        setErrorMessage('Error checking upload permission.');
        setCanUpload(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkUploadPermission();
  }, []);

  // Check for camera support on mount
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsCameraSupported(true);
    }
  }, []);

  // Effect to handle starting/stopping the camera stream
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup function to stop camera when component unmounts or isCameraActive becomes false
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive]); // Rerun only when isCameraActive changes

  // --- WebSocket Message Handling ---
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      setCurrentMessage(message);
      if (!chatWindowVisible && !showBubble) {
        setShowBubble(true);
      }
    };
    if (!chatId) return;
    const unsubscribe = listenForMessages(handleNewMessage);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, listenForMessages, chatWindowVisible, showBubble]);

  // --- Camera Functions ---
  const startCamera = async () => {
    // Stop any existing stream first
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer rear camera
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMessage('Could not access the camera. Please check permissions!');
      setIsCameraActive(false); // Turn off camera state on error
      // Fallback or specific error handling for different errors (NotAllowedError, NotFoundError) could go here
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No camera found on this device.');
        setIsCameraSupported(false); // If no camera is found, update support status
      } else {
        setErrorMessage('An error occurred while trying to access the camera.');
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]); // Dependency on cameraStream

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg'); // Or 'image/png'
      setImage(dataUrl); // Set the main image state
      resetStateBeforeUpload(); // Clear previous upload data
      setIsCameraActive(false); // This will trigger the useEffect cleanup to stop the stream
    }
  };

  const handleOpenCamera = () => {
    setIsCameraActive(true);
    // Clear any existing image/error when opening camera
    setImage(null);
    setErrorMessage('');
    resetStateBeforeUpload();
  };

  const handleCancelCamera = () => {
    setIsCameraActive(false); // This triggers stopCamera via useEffect
    setErrorMessage(''); // Clear any camera-related errors
  };

  // --- File Input Handling ---
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        resetStateBeforeUpload();
      };
      reader.readAsDataURL(selectedFile);
      // Clear the file input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    // Clear any existing image/error when choosing file
    setImage(null);
    setErrorMessage('');
    resetStateBeforeUpload();
    fileInputRef.current?.click();
  };

  // --- Upload Logic ---
  const handleUpload = async () => {
    if (!image) {
      setErrorMessage('Please pick a picture or take a photo first!');
      return;
    }
    setIsUploading(true);
    setErrorMessage('');
    try {
      const base64Image = image.split(',')[1];
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64Image }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setCaption(data.caption);
      setBoundingBoxes(Array.isArray(data.bbox) ? data.bbox : []);
      setAudioSrc(''); // Clear previous audio immediately
      setObjectAudios([]);
      setTimeout(() => { // Set new audio after a brief delay for UI update
        setAudioSrc(data.audio);
        setObjectAudios(data.objectAudio || []); // Ensure objectAudios is always an array
        setHasUploaded(true);
        setChatId(data.chatId);
        setIsBookmarked(data.isBookmarked);
      }, 50);
    } catch (err) {
      console.error('Error uploading image:', err);
      setErrorMessage(`Oops! Something went wrong during upload: ${err.message}`);
      // Optionally reset parts of the state on upload error
      // setHasUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  // --- Audio Playback ---
  const playMainAudio = () => {
    if (currentAudioRef.current) currentAudioRef.current.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing main audio:", e));
      currentAudioRef.current = audioRef.current;
    }
  };

  const playObjectAudio = (objectName, boxId) => {
    if (currentAudioRef.current) currentAudioRef.current.pause();
    const entry = objectAudios.find(o => o.object === objectName);
    if (!entry || !entry.audio) return; // Check if entry and audio URL exist
    try {
      const audio = new Audio(entry.audio);
      audio.play().catch(e => console.error("Error playing object audio:", e));
      currentAudioRef.current = audio;
      setHighlightedBoxId(boxId);
      setTimeout(() => setHighlightedBoxId(null), 1500);
    } catch (e) {
      console.error("Error creating or playing object audio:", e);
    }
  };

  // --- UI Interaction Handlers ---
  const handleBoxHover = (box) => { /* Future use */
  };
  const handleBoxClick = (box) => playObjectAudio(box.object, box.id);
  const handleMarkClick = (markId) => {
    const box = boundingBoxes.find(b => String(b.id) === String(markId));
    if (box) playObjectAudio(box.object, box.id);
  };

  const toggleBookmark = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(`${apiUrl}/chat/bookmark/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update bookmark');
      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setErrorMessage('Could not update bookmark.'); // User-facing error
    }
  };

  const handleBack = () => navigate(-1);

  // Resets state related to a specific upload/capture, keeping the image preview if available
  const resetStateBeforeUpload = () => {
    setCaption('');
    setAudioSrc('');
    setBoundingBoxes([]);
    setHasUploaded(false);
    setIsBookmarked(false);
    setChatId(null);
    // setErrorMessage(''); // Keep potential camera errors unless explicitly cleared
    setMessages([]);
    setShowBubble(false);
    setChatWindowVisible(false);
    setObjectAudios([]);
    setHighlightedBoxId(null);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  // Resets everything, including the image
  const resetUpload = () => {
    setImage(null);
    setIsCameraActive(false); // Ensure camera is off
    resetStateBeforeUpload();
    setErrorMessage(''); // Clear all errors on full reset
  };

  const handleBubbleClick = () => {
    setShowBubble(false);
    setChatWindowVisible(true);
  };

  // --- Render Logic ---
  const renderUploadOptions = () => (
    <div className="childUploadImage-drop-zone">
      <div className="childUploadImage-options">
        <button onClick={triggerFileInput} className="childUploadImage-option-button">
          <span className="childUploadImage-drop-icon">🖼️</span>
          Pick a Picture
        </button>
        {isCameraSupported && (
          <button onClick={handleOpenCamera} className="childUploadImage-option-button">
            <span className="childUploadImage-drop-icon">📷</span>
            Take a Photo
          </button>
        )}
      </div>
      <p className="childUploadImage-drop-hint">(Or drag a picture here - desktop only)</p>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        className="childUploadImage-file-input"
        style={{ display: 'none' }} // Keep it accessible but visually hidden
      />
    </div>
  );

  const renderCameraView = () => (
    <div className="childUploadImage-camera-view">
      <video ref={videoRef} playsInline autoPlay muted className="childUploadImage-video-feed"></video>
      {/* Hidden canvas for capturing frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <div className="childUploadImage-camera-controls">
        <button onClick={captureImage} className="childUploadImage-capture-button">
          📸 Snap!
        </button>
        <button onClick={handleCancelCamera} className="childUploadImage-cancel-button">
          ❌ Cancel
        </button>
      </div>
    </div>
  );

  const renderImagePreview = () => (
    <div className="childUploadImage-preview-container">
      <div className="childUploadImage-preview-frame">
        <img src={image} alt="Preview" className="childUploadImage-preview"/>
      </div>
      <button
        onClick={handleUpload}
        disabled={isUploading}
        className="childUploadImage-upload-button"
      >
        {isUploading ? (
          <span className="childUploadImage-uploading">
            <span className="childUploadImage-spinner">🌀</span> Magic is happening...
          </span>
        ) : (
          '✨ Tell Me About This Picture!'
        )}
      </button>
      {/* Add a button to clear the preview and go back to options */}
      <button
        onClick={resetUpload} // Use resetUpload to clear the image too
        className="childUploadImage-change-button"
        disabled={isUploading}
      >
        🔄 Change Picture
      </button>
    </div>
  );

  const renderResultView = () => (
    <div className="childUploadImage-result-container">
      <div className="childUploadImage-image-container">
        {/* Bookmark Button - Placed here for better context */}
        {chatId && (
          <button
            onClick={toggleBookmark}
            className={`childUploadImage-bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this chat'}
          >
            {isBookmarked ? '★' : '☆'} {/* Filled/Empty star */}
          </button>
        )}
        <div className="childUploadImage-highlighter-wrapper">
          <ImageHighlighter
            imageSrc={image}
            boundingBoxes={boundingBoxes}
            onBoxHover={handleBoxHover}
            externallyHighlightedId={highlightedBoxId}
            onBoxClick={handleBoxClick}
          />
        </div>
      </div>
      <div className="childUploadImage-caption-box">
        <h3>🎤 Story About Your Picture:</h3>
        <TextHighlighter>
          <CaptionRenderer
            caption={caption}
            onMarkClick={handleMarkClick}
          />
        </TextHighlighter>
        {audioSrc && (
          <div className="childUploadImage-audio-player">
            <button
              onClick={playMainAudio}
              className="childUploadImage-play-button"
            >
              ▶️ Play Story
            </button>
            <audio ref={audioRef} className="childUploadImage-audio-element" preload="metadata">
              <source src={audioSrc} type="audio/mpeg"/>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
      <button
        onClick={resetUpload}
        className="childUploadImage-new-upload-button"
      >
        🖼️ Try Another Picture!
      </button>
    </div>
  );


  return (
    <div className="childUploadImage-container">
      <button onClick={handleBack} className="childUploadImage-back-button">
        ⬅️ Back to Fun Zone
      </button>
      <div className="childUploadImage-content">
        <h1 className="childUploadImage-title">📷 Picture Explorer!</h1>
        {checkingPermission ? (
          <div className="childUploadImage-loading">Checking permission...</div>
        ) : !canUpload ? (
          <div className="childUploadImage-error">
            🚫 {errorMessage || 'You are not allowed to upload images.'}
          </div>
        ) : (
          <>
            <div className="childUploadImage-upload-area">
              {/* Conditional Rendering based on state */}
              {!image && !isCameraActive && renderUploadOptions()}
              {isCameraActive && renderCameraView()}
              {image && !hasUploaded && !isCameraActive && renderImagePreview()}
              {image && hasUploaded && renderResultView()}

              {/* Error Message Display */}
              {errorMessage && <div className="childUploadImage-error">{errorMessage}</div>}
            </div>

            {/* Notification Bubble */}
            {showBubble && !chatWindowVisible && (
              <div className="childUploadImage-notification-bubble" onClick={handleBubbleClick}>
                🗨️ New Message!
              </div>
            )}

            {/* Chat Window */}
            {chatWindowVisible && chatId && ( // Only show if there's a chatId
              <div className="childUploadImage-chat-window">
                <div className="childUploadImage-chat-header">
                  <h3>Messages from Adult:</h3>
                  <button onClick={() => setChatWindowVisible(false)} className="childUploadImage-chat-close">✖</button>
                </div>
                <div className="childUploadImage-chat-messages">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <div key={index} className="childUploadImage-chat-message">
                        <p>{msg.note}</p>
                        {/* Optionally display timestamp if available */}
                        {/* <span className="chat-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span> */}
                      </div>
                    ))
                  ) : (
                    <p>No messages yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}  
      </div>
    </div>
  );
};

export default ChildUploadImagePage;