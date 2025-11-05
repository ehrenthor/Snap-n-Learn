import React from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './ChildQuizResultPage.css';

const ChildQuizResultPage = () => {
  const navigate = useNavigate();
  const quizName = Cookies.get('quizName');
  const correctCount = Cookies.get('quizScore');
  const totalQuestions = Cookies.get('quizTotal');

  const handleNavigation = (path) => {
    // Remove result cookies
    Cookies.remove('quizScore');
    Cookies.remove('quizTotal');
    Cookies.remove('quizName');
    Cookies.remove('quizId');    
    navigate(path);
  };

  return (
    <div className="childQuizResult-container">
      <h1 className="childQuizResult-title">🎉 {quizName} Results 🎉</h1>
      
      <div className="childQuizResult-score">
        <h2>Space Explorer Score 🚀</h2>
        <div className="childQuizResult-scoreText">
          {correctCount} / {totalQuestions} Correct Answers!
        </div>
        <div className="childQuizResult-progress">
          <div 
            className="childQuizResult-progressBar"
            style={{ width: `${(correctCount / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="childQuizResult-buttonGroup">
        <button 
          className="childQuizResult-button childQuizResult-mainButton"
          onClick={() => handleNavigation('/childQuizMain')}
        >
          🏡 Back to Quiz Galaxy
        </button>
      </div>
    </div>
  );
}

export default ChildQuizResultPage;