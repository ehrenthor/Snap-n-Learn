import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      // Convert the image to base64
      const base64Image = await fileToBase64(selectedFile);

      // Store the original image for display purposes
      const imageUrl = URL.createObjectURL(selectedFile);
      sessionStorage.setItem('lastUploadedImage', imageUrl);

      // Send to API
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();

      // Store caption and audio data for the detail page
      sessionStorage.setItem('imageCaption', data.caption);

      // Store audio data if it exists
      if (data.audio) {
        sessionStorage.setItem('audioData', data.audio);
      }

      // Redirect to detail page
      navigate(`/test/${data.chatId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process image. Please try again.');
      setIsLoading(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 string without the data URL prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <h1>Image Upload Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: '15px' }}
        />
      </div>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        style={{
          padding: '8px 16px',
          backgroundColor: !selectedFile || isLoading ? '#cccccc' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedFile || isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Processing...' : 'Upload'}
      </button>
    </div>
  );
}

export default UploadPage;