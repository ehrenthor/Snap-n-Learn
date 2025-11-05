import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AdultChildUploadHistoryDetailPage.css";
import TextHighlighter from '../../Component/TextHighlighter';

const apiUrl = process.env.REACT_APP_API_URL;

const AdultChildUploadHistoryDetailPage = () => {
  const { username, chatId } = useParams();
  const navigate = useNavigate();
  const [chatDetails, setChatDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const audioRef = useRef(null);
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userResponse = await fetch(`${apiUrl}/users/children/${username}`, {
          method: "GET",
          credentials: "include",
        });
        if (!userResponse.ok) throw new Error(`Server responded with ${userResponse.status}`);
        const userData = await userResponse.json();
        setUserid(userData.userid);
      } catch (error) {
        console.error("Error fetching userId:", error); // Log error for debugging
        setErrorMessage(`Failed to load user details: ${error.message}`);
        setLoading(false); // Stop loading if error occurs
      }
    };

    // Only fetch the userId if we have a username
    if (username) {
      fetchUserId();
    } else {
      setErrorMessage("Username not found.");
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!userid || !chatId) return; // Don't proceed if userId or chatId are not available

    const fetchChatDetails = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(`${apiUrl}/chat/userchats/${userid}/${chatId}`, { 
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        if (data.image && !data.image.startsWith('data:image')) {
          data.image = `data:image/jpeg;base64,${data.image}`;
        }
        setChatDetails(data);
      } catch (error) {
        console.error("Error fetching chat details:", error);
        setErrorMessage(`Failed to load chat details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
  }, [userid, chatId]);

  const handleBoxHover = (box) => {

  };

  return (
    <div className="adultChildUploadHistoryDetail-container">
      <button className="adultChildUploadHistoryDetail-back-button" onClick={() => navigate(-1)}>
        ← Back to history
      </button>
      <h1 className="adultChildUploadHistoryDetail-title">Image Details</h1>

      {loading && <p className="adultChildUploadHistoryDetail-loading">Loading your memory... ⏳</p>}
      {errorMessage && <p className="adultChildUploadHistoryDetail-error">Oops! {errorMessage}</p>}

      {chatDetails && !loading && (
        <div className="adultChildUploadHistoryDetail-content">

          <div className="adultChildUploadHistoryDetail-image-container">
            {chatDetails.image ? (
              <img
                src={chatDetails.image}
                alt="Chat detail"
                className="adultChildUploadHistoryDetail-image"
              />
            ) : (
              <div className="adultChildUploadHistoryDetail-no-image">No image available 🖼️</div>
            )}
          </div>

          <div className="childUploadImage-caption-box">
            <h3 className="childUploadImage-caption-title">🎤 Story About Your Picture:</h3>
            {chatDetails.caption ? (
              <TextHighlighter>
                <p className="childUploadImage-caption-text">{chatDetails.caption.replace(/<[^>]+>/g, '')}</p>
              </TextHighlighter>
            ) : (
              <p className="childUploadImage-caption-text">No story found for this picture.</p>
            )}

            {chatDetails.audio && (
              <div className="childUploadImage-audio-player">
                <button
                  onClick={() => audioRef.current?.play()}
                  className="childUploadImage-play-button"
                  aria-label="Play story audio"
                >
                  ▶️ Play Story
                </button>
                <audio
                  ref={audioRef}
                  className="childUploadImage-audio-element"
                  preload="metadata"
                  controls
                >
                  <source src={chatDetails.audio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdultChildUploadHistoryDetailPage;
