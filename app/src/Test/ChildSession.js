import React, { useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
const apiUrl = process.env.REACT_APP_API_URL;

const TestChild = () => {
  const { socket, connected, error } = useSocket('Child');
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        setImage(event.target.result);
      };

      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setErrorMessage('Please select an image first');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      // Extract base64 data from the data URL
      const base64Image = image.split(',')[1];

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: base64Image
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      setCaption(data.caption);
      setAudioSrc(data.audio);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play();
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setErrorMessage(`Failed to upload image: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="test-child-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Test Child Page</h1>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <div className="connection-status" style={{ marginBottom: '15px' }}>
        Connection Status: {connected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="image-upload-section" style={{ marginBottom: '20px' }}>
        <h2>Upload Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ marginBottom: '10px' }}
        />

        {image && (
          <div className="image-preview" style={{ marginBottom: '10px' }}>
            <img
              src={image}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px' }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!image || isUploading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {errorMessage && (
          <div className="upload-error" style={{ color: 'red', marginTop: '10px' }}>
            {errorMessage}
          </div>
        )}
      </div>

      {caption && (
        <div className="caption-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>Generated Caption:</h3>
          <p>{caption}</p>

          {audioSrc && (
            <div className="audio-player" style={{ marginTop: '10px' }}>
              <audio ref={audioRef} controls>
                <source src={audioSrc} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestChild;