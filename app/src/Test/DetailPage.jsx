import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
const apiUrl = process.env.REACT_APP_API_URL;

function DetailPage() {
  const { uuid: chatId } = useParams();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [audioData, setAudioData] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieve from sessionStorage first
    const storedImageUrl = sessionStorage.getItem('lastUploadedImage');
    const storedCaption = sessionStorage.getItem('imageCaption');
    const storedAudioData = sessionStorage.getItem('audioData');

    if (storedImageUrl && storedCaption) {
      setImageUrl(storedImageUrl);
      setCaption(storedCaption);
      if (storedAudioData) {
        setAudioData(storedAudioData);
      }
      setLoading(false);
    } else {
      // Fetch from server if not found in sessionStorage
      fetchChatData(chatId);
    }
  }, [chatId]);

  const fetchChatData = async (chatId) => {
    try {
      const response = await fetch(`${apiUrl}/chat/${chatId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve chat data.');
      }

      const data = await response.json();
      setImageUrl(data.image);
      setCaption(data.caption);
      if (data.audio) {
        setAudioData(data.audio);
      }

      // Store in sessionStorage for future navigation
      sessionStorage.setItem('lastUploadedImage', data.image);
      sessionStorage.setItem('imageCaption', data.caption);
      if (data.audio) {
        sessionStorage.setItem('audioData', data.audio);
      }

    } catch (err) {
      console.error('Error fetching chat data:', err);
      setError('Failed to retrieve data. The chat may not exist or you may not have access.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <p>{error}</p>
          <Link to="/test/new">Upload a new image</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>Analysis Results</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Chat ID:</strong> {chatId}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2>Uploaded Image</h2>
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
          />
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h2>Caption</h2>
          <p>{caption}</p>
          {audioData && (
            <div style={{ marginTop: '15px' }}>
              <h3>Audio Caption</h3>
              <audio
                controls
                src={audioData}
                style={{ width: '100%' }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: '30px' }}>
        <Link
          to="/test/new"
          style={{
            padding: '8px 16px',
            backgroundColor: '#4285f4',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Upload Another Image
        </Link>
      </div>
    </div>
  );
}

export default DetailPage;