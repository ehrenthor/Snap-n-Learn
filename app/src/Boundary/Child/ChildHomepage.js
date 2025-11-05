import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Contexts/AuthContext';
import Swal from 'sweetalert2';
import './ChildHomepage.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AnimatedCharacter from '../../Component/AnimatedCharacter';

const apiUrl = process.env.REACT_APP_API_URL;

const ChildHomepage = () => {
  const { setAuthState } = useAuth(); 
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState(null);
  const [pageVisible, setPageVisible] = useState(false);
  const [exitTransition, setExitTransition] = useState(false);
  const [buttonClick, setButtonClick] = useState(null);

  useEffect(() => {
    // Page fade in on mount
    setPageVisible(true);
    return () => setPageVisible(false);
  }, []);

  const handleExit = async () => {
    setExitTransition(true);
    try {
      await fetch(`${apiUrl}/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });
  
      setAuthState({
        isAuthenticated: false,
        userType: null,
        username: null,
        userId: null
      });
  
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Logout Failed',
        text: 'There was a problem logging out. Please try again.',
      });
    }
    setTimeout(() => {
      Cookies.remove("username");
      navigate("/");
    }, 500);

  };

  const buttonMessages = {
    1: "Let's have some fun and learn about images! 📸",
    2: "Embark on today’s adventure quest! 🌟",
    3: "Check out your amazing learning progress! 🏆",
    4: "Test your knowledge with fun quizzes! 🎯"
  };

  const handleButtonClick = (buttonNumber) => {
    setButtonClick(buttonNumber);
    setTimeout(() => {
      if (buttonNumber === 1) {
        navigate('/childUploadImage');
      }
      else if (buttonNumber === 2) {
        navigate('/childChallengeMain');
      }
      else if (buttonNumber === 3) {
        navigate('/childUploadHistory');
      }
      else {
        navigate('/childQuizMain');
      }
      // Add navigation for other buttons if needed
    }, 500); // Match with CSS animation duration
  };

  return (
    <div className={`childHomepage-container ${pageVisible ? 'childHomepage-fadeIn' : ''} ${exitTransition ? 'childHomepage-fadeOut' : ''}`}>
      <div className="childHomepage-characterContainer">
        {activeButton && (
          <div className={`childHomepage-speechBubble ${activeButton ? 'childHomepage-speechFadeIn' : 'childHomepage-speechFadeOut'}`}>
            {buttonMessages[activeButton]}
          </div>
        )}
        <AnimatedCharacter />
      </div>
      
      <h1 className="childHomepage-title">Fun Learning Zone!</h1>
      <div className="childHomepage-buttonsContainer">
        <div className="childHomepage-buttonRow">
          <button 
            className={`childHomepage-button childHomepage-button1 ${buttonClick === 1 ? 'childHomepage-zoomOut' : ''}`}
            onClick={() => handleButtonClick(1)}
            onMouseEnter={() => setActiveButton(1)}
            onMouseLeave={() => setActiveButton(null)}
          >
            📸 Picture Learning
            <div className="childHomepage-buttonSubtext">Upload pictures to learn!</div>
          </button>
          <button 
            className={`childHomepage-button childHomepage-button2 ${buttonClick === 2 ? 'childHomepage-zoomOut' : ''}`}
            onClick={() => handleButtonClick(2)}
            onMouseEnter={() => setActiveButton(2)}
            onMouseLeave={() => setActiveButton(null)}
          >
            🌟 Daily Adventure Quest
            <div className="childHomepage-buttonSubtext">Unlock new challenges every day!</div>
          </button>
        </div>
        <div className="childHomepage-buttonRow">
          <button 
            className={`childHomepage-button childHomepage-button3 ${buttonClick === 3 ? 'childHomepage-zoomOut' : ''}`}
            onClick={() => handleButtonClick(3)}
            onMouseEnter={() => setActiveButton(3)}
            onMouseLeave={() => setActiveButton(null)}
          >
            🏆 My Learning Journey
            <div className="childHomepage-buttonSubtext">See what I've learned!</div>
          </button>
          <button 
            className={`childHomepage-button childHomepage-button4 ${buttonClick === 4 ? 'childHomepage-zoomOut' : ''}`}
            onClick={() => handleButtonClick(4)}
            onMouseEnter={() => setActiveButton(4)}
            onMouseLeave={() => setActiveButton(null)}
          >
            🎯 Fun Quizzes
            <div className="childHomepage-buttonSubtext">Test what I know!</div>
          </button>
        </div>
      </div>
      <button 
        className={`childHomepage-exitButton ${exitTransition ? 'childHomepage-fadeOut' : ''}`} 
        onClick={handleExit}
      >
        👋 Bye-Bye!
      </button>
    </div>
  );
};

export default ChildHomepage;