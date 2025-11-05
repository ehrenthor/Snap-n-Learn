import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Lottie from 'lottie-react';
import "./ChildChallengeQuestionPage.css";
import ImageHighlighterChallenge from '../../Component/ImageHighlighterChallenge';
import celebrationAnimation from "../../Assets/celebration.json";
import wrongAnimation from "../../Assets/sad.json";
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_API_URL;

const ChildChallengeQuestionPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chatDetails, setChatDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedBox, setSelectedBox] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWrongAnswer, setShowWrongAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");

  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(`${apiUrl}/chat/getChallenge/${chatId}`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const data = await response.json();
        if (data.image && !data.image.startsWith('data:image')) {
          data.image = `data:image/jpeg;base64,${data.image}`;
        }
        setCorrectAnswer(data.challengeDetails.correctAnswer);
        setChatDetails(data);
      } catch (error) {
        console.error("Error fetching chat details:", error);
        setErrorMessage(`Failed to load challenge: ${error.message}`);
        navigate("/childChallengeMain");
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [chatId]);

  useEffect(() => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
      handleChallengeCompleted();
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
        navigate("/childChallengeMain");
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowWrongAnswer(true);
      const timer = setTimeout(() => setShowWrongAnswer(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedAnswer, correctAnswer, navigate]
  );
  
  const handleAnswerSelect = (box) => {
    setSelectedBox(box.id);
    setSelectedAnswer(box.object);
  };

  const handleChallengeCompleted = async () => {
    try {
      const response = await fetch(`${apiUrl}/chat/challengeCompleted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId
        })
      });

      if (!response.ok) throw new Error('Challenge Completion Interrupted.');
    } catch (error) {
      Swal.fire('Oops! 🌈', 'Failed to complete challenge! Please try again.', 'error');
      navigate("/childQuizMain");
    }
  };

  return (
    <div className="childChallengeQuestion-container">
      {showCelebration && (
        <div className="childChallengeQuestion-animation-overlay">
          <Lottie
            animationData={celebrationAnimation}
            loop={false}
            style={{ width: 400, height: 400 }}
          />
        </div>
      )}

      {showWrongAnswer && (
        <div className="childChallengeQuestion-animation-overlay">
          <Lottie
            animationData={wrongAnimation}
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </div>
      )}

      <button className="childChallengeQuestion-back-button" onClick={() => navigate("/childChallengeMain")}>
        ⬅️ Back to Challenges
      </button>
      <h1 className="childChallengeQuestion-title">Where is the {correctAnswer} ? 🕵️♀️</h1>

      {loading && <p className="childChallengeQuestion-loading">Loading challenge... 🚀</p>}
      {errorMessage && <p className="childChallengeQuestion-error">Oops! {errorMessage}</p>}

      {chatDetails && !loading && (
        <div className="childChallengeQuestion-content">
          <div className="childChallengeQuestion-image-container">
            {chatDetails.image ? (
              <ImageHighlighterChallenge
                imageSrc={chatDetails.image}
                boundingBoxes={chatDetails.bbox || []}
                selectedBox={selectedBox}
                onBoxClick={handleAnswerSelect}
                isChallenge={true}
                className="childChallengeQuestion-highlighted-image"
              />
            ) : (
              <div className="childChallengeQuestion-no-image">No image available 🖼️</div>
            )}
          </div>

          <div className="childChallengeQuestion-answer-section">
            <div className="childChallengeQuestion-answer-box">
              <span className="childChallengeQuestion-answer-label">Your Answer:</span>
              {selectedAnswer ? (
                <div className="childChallengeQuestion-answer-text bubble">
                  {selectedAnswer} {["🎉", "🌟", "💡"][Math.floor(Math.random() * 3)]}
                </div>
              ) : (
                <div className="childChallengeQuestion-answer-placeholder">
                  Click on something in the picture! 👆
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildChallengeQuestionPage;