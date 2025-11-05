import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChildChallengeMainPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

const ChildChallengeMainPage = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch(`${apiUrl}/chat/chats`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        const today = new Date();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate());
        cutoffDate.setHours(0, 0, 0, 0);

        // const activeChallenges = Array.isArray(data.chats) 
        //   ? data.chats.filter(chat => {
        //     const chatDate = new Date(chat.uploadedAt);
        //     return (chat.status === 'active' && chatDate < cutoffDate);
        //   })
        //   : [];

        const activeChallenges = Array.isArray(data.chats) 
          ? data.chats.filter(chat => {
            const chatDate = new Date(chat.uploadedAt);
            return (chat.status === 'active');
          })
          : [];

        setChallenges(activeChallenges);
      } catch (error) {
        console.error("Error fetching challenges:", error);
        setErrorMessage(`Failed to load challenges: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleBack = () => navigate("/childHomepage");

  const handleChallengeStart = (chatId) => {
    navigate(`/childChallengeQuestion/${chatId}`);
  };

  return (
    <div className="childChallengeMain-container">
      <button onClick={handleBack} className="childChallengeMain-back-button">
        ⬅️ Back to Adventure Map
      </button>
      <div className="childChallengeMain-content">
        <h1 className="childChallengeMain-title">🌟 Daily Adventure Quest</h1>

        {loading && <p className="childChallengeMain-loading">Loading challenges...</p>}
        {errorMessage && <div className="childChallengeMain-error">{errorMessage}</div>}

        <div className="childChallengeMain-grid">
          {challenges.length > 0 ? (
            challenges.map(({ chatId, imageUrl, caption, challengeDone }) => (
              <div 
                key={chatId}
                className={`childChallengeMain-card ${challengeDone ? 'childChallengeMain-card--completed' : ''}`}
              >
                <div className="childChallengeMain-cardContent">
                  {challengeDone ? (
                    <div className="childChallengeMain-completedBadge">✅</div>
                  ) : null}
                  <h3 className="childChallengeMain-cardLabel">
                    {caption?.text?.generalLabel || "Mystery Challenge"}
                  </h3>
                  <img
                    src={imageUrl || "/placeholder.jpg"}
                    alt="Challenge visual"
                    className="childChallengeMain-cardImage"
                  />
                  <button 
                    onClick={() => handleChallengeStart(chatId)}
                    className={`childChallengeMain-cardButton ${
                      challengeDone ? 'childChallengeMain-cardButton--review' : 'childChallengeMain-cardButton--start'
                    }`}
                  >
                    {challengeDone ? "Review Quest" : "Start Quest!"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            !loading && <p className="childChallengeMain-noHistory">🌌 Mission Control says: New challenges launching tomorrow! 🚀</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildChallengeMainPage;