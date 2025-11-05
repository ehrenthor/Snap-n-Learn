import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './AdultJoinChildSessionPage.css';
import Cookies from 'js-cookie';
import Sidebar from '../../Component/AdultSidebar';
import Header from '../../Component/AdultHeader';
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const AdultJoinChildSession = () => {
  const { socket, connected, error } = useSocket('Adult');
  const [activeSessions, setActiveSessions] = useState([]);
  const [captionedImages, setCaptionedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [note, setMessage] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeChildId, setActiveChildId] = useState(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [adultId, setAdultId] = useState(null); // Add state to store adultId
  const adultUsername = Cookies.get("username");
  const childUsername = Cookies.get("childUsername");
  const navigate = useNavigate();
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (!adultUsername) return;

    // Fetch adultId by adultUsername
    const fetchAdultId = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/getid/${adultUsername}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        setAdultId(data.userId); // Set the adultId state with the fetched userId
      } catch (error) {
        console.error('Error fetching adult ID:', error);
      }
    };

    fetchAdultId();
  }, [adultUsername]);

  useEffect(() => {
    if (!socket) return;

    socket.on('activeSessions', (sessions) => {
      setActiveSessions(sessions);
    });

    socket.on('newImageCaption', async (data) => {
      try {
        setLoading(true);
        await fetchChatData(data.chatId);
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    });

    socket.on('receiveMessage', (messageData) => {
      if (messageData.sessionId === activeSessionId) {
        setChatMessages(prevMessages => [...prevMessages, messageData]);
      }
    });

    return () => {
      socket.off('activeSessions');
      socket.off('newImageCaption');
      socket.off('receiveMessage');
    };
  }, [socket, activeSessionId]);

  const fetchChatData = async (chatId) => {
    try {
      const response = await fetch(`${apiUrl}/chat/${chatId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();

      setCaptionedImages(prevImages => [
        ...prevImages,
        {
          id: chatId,
          caption: data.caption,
          image: data.image,
          audio: data.audio,
          timestamp: new Date().toLocaleString()
        }
      ]);
    } catch (err) {
      console.error('Error fetching chat data:', err);
    }
  };

  const handleBackButton = () => {
    Cookies.remove('childUsername');
    Cookies.remove('childUserId');
    navigate(`/adultHomepage`);
  };

  const handleSendMessage = () => {
    if (note.trim() && activeSessionId && activeChildId && adultId) {
      socket.emit('sendMessage', {
        sessionId: activeSessionId,
        adultId,
        childId: activeChildId,
        note
      });
      setMessage('');
    }
  };

  const childUserId = Cookies.get("childUserId");

  return (
    <div className="joinChildSession-page">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleSidebarButton={toggleSidebar}
      />
      <div
        className={`joinChildSession-container ${isSidebarOpen ? 'joinChildSession-shifted' : 'joinChildSession-full'}`}>
        <Header/>
        <div className="joinChildSession-header">
          <button onClick={handleBackButton} className="joinChildSession-back-btn">
            ← Back to Dashboard
          </button>
          <h1>{childUsername}'s Learning Session</h1>
        </div>

        {error && <div className="joinChildSession-error-message">{error}</div>}

        <div className="joinChildSession-content">
          <div className="joinChildSession-session-section">
            <h2 className="joinChildSession-section-title">Active Learning Sessions</h2>
            {activeSessions.length === 0 ? (
              <div className="joinChildSession-empty-state">No active sessions available</div>
            ) : (
              <div className="joinChildSession-session-cards">
                {activeSessions.filter(session => session.childId === childUserId).map(session => (
                  <div key={session.sessionId} className="joinChildSession-session-card">
                    <div className="joinChildSession-session-info">
                      <h3>Learning Session</h3>
                      <p>In progress</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSessionId(session.sessionId);
                        setActiveChildId(session.childId);
                        setShowChatPanel(true);
                      }}
                      className={`joinChildSession-join-btn ${activeSessionId === session.sessionId ? 'active' : ''}`}
                    >
                      {activeSessionId === session.sessionId ? (
                        <>🎧 Connected</>
                      ) : (
                        <>▶ Join Session</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="joinChildSession-image-upload-section">
            <h2 className="joinChildSession-section-title">Captured Moments</h2>
            {loading && <div className="joinChildSession-loading-state">Loading new content...</div>}
            {captionedImages.length === 0 ? (
              <div className="joinChildSession-empty-state">No images captured yet</div>
            ) : (
              <div className="joinChildSession-image-grid">
                {captionedImages.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="joinChildSession-moment-card">
                    <div className="joinChildSession-card-header">
                      <span className="joinChildSession-timestamp">{item.timestamp}</span>
                    </div>
                    <img src={item.image} alt="Captured moment" className="joinChildSession-moment-image"/>
                    <div className="joinChildSession-card-footer">
                      <div className="joinChildSession-caption-section">
                        <h4>Child's Interpretation</h4>
                        <p className="joinChildSession-caption">{item.caption.replace(/<[^>]+>/g, '')}</p>
                      </div>
                      <div className="joinChildSession-audio-section">
                        <h4>Voice Explanation</h4>
                        <audio controls className="joinChildSession-audio-player">
                          <source src={item.audio} type="audio/mpeg"/>
                        </audio>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`joinChildSession-chat-panel ${showChatPanel ? 'visible' : ''}`}>
          <div className="joinChildSession-chat-header">
            <h3>Live Chat with {childUsername}</h3>
            <button
              onClick={() => setShowChatPanel(false)}
              className="joinChildSession-close-chat-btn"
            >
              ×
            </button>
          </div>
          <div className="joinChildSession-chat-messages">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`joinChildSession-message-bubble ${
                  msg.adultId === adultId ? 'sent' : 'received'
                }`}
              >
                <p>{msg.note}</p>
                <span className="joinChildSession-message-time">{new Date().toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
          <div className="joinChildSession-chat-input">
            <input
              type="text"
              value={note}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} className="joinChildSession-send-btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdultJoinChildSession;
