import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdultViewQuizPage.css';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_API_URL;

const AdultViewQuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const quizId = Cookies.get("quizId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${apiUrl}/quiz/getQuizQuestion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId }),
        });
        const data = await response.json();

        setQuiz({
          id: quizId,
          name: data.quizName,
          questions: data.quizQuestion.questions || []
        });
      } catch (error) {
        Swal.fire('Error', 'Failed to load quiz!', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  const handleBack = () => {
    navigate('/adultQuizMain');
  };

  if (loading) {
    return (
      <div className="adultViewQuiz-loading">
        <div className="adultViewQuiz-loader"></div>
        <h2>Loading Quiz...</h2>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="adultViewQuiz-error">
        <h2>Quiz Not Found</h2>
        <button onClick={handleBack} className="adultViewQuiz-backButton">
          Back to Management
        </button>
      </div>
    );
  }

  return (
    <div className="adultViewQuiz-container">
      <div className="adultViewQuiz-header">
        <button 
          className="adultViewQuiz-backButton"
          onClick={handleBack}
        >
          ← Back to Quizzes
        </button>
        <h1 className="adultViewQuiz-title">{quiz.name}</h1>
      </div>

      <div className="adultViewQuiz-questionCard">
        <div className="adultViewQuiz-questionCounter">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
        
        <div className="adultViewQuiz-questionContent">
          <h3 className="adultViewQuiz-questionText">
            {quiz.questions[currentQuestion].text}
          </h3>

          {quiz.questions[currentQuestion].imgPath && (
            <div className="adultViewQuiz-imageContainer">
              <img 
                src={quiz.questions[currentQuestion].imgPath}
                alt="Question visual"
                className="adultViewQuiz-questionImage"
              />
            </div>
          )}
        </div>

        <div className="adultViewQuiz-options">
          {quiz.questions[currentQuestion].options.map((option, i) => {
            const optionText = Array.isArray(option) ? option.join(' ') : option;
            return (
              <div
                key={i}
                className={`adultViewQuiz-option ${i === quiz.questions[currentQuestion].correct ? 'correct' : ''}`}
              >
                <span className="adultViewQuiz-optionText">{optionText}</span>
                {i === quiz.questions[currentQuestion].correct && (
                  <span className="adultViewQuiz-correctIndicator">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="adultViewQuiz-navigation">
        <button
          className="adultViewQuiz-navButton"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          ← Previous
        </button>
        <button
          className="adultViewQuiz-navButton"
          disabled={currentQuestion === quiz.questions.length - 1}
          onClick={() => setCurrentQuestion(prev => prev + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default AdultViewQuizPage;