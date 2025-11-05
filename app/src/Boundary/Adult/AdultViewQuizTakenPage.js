import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdultViewQuizTakenPage.css';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_API_URL;

const AdultViewQuizTakenPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await fetch(`${apiUrl}/quiz/getQuizReview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: Cookies.get('childUsername'),
            quizId: Cookies.get('quizId'),
            datetimeTaken: Cookies.get('quizDateTime')
          })
        });

        const data = await response.json();
        if (response.ok) {
          const quizDetails = data.quizDetails[0];
          const takenDetails = data.quizTakenDetails[0];

          const processedAnswers = {};
          takenDetails.answers.forEach(([qNo, answer, correctness]) => {
            processedAnswers[qNo - 1] = {
              selected: answer,
              isCorrect: correctness === 'T'
            };
          });

          setQuizData({
            name: quizDetails.quizName,
            date: new Date(takenDetails.datetimeTaken).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            time: new Date(takenDetails.datetimeTaken).toLocaleTimeString(),
            score: takenDetails.answers.filter(a => a[2] === 'T').length,
            totalQuestions: quizDetails.questions.questions.length,
            questions: quizDetails.questions.questions.map((q, index) => ({
              ...q,
              userAnswer: processedAnswers[index]?.selected ?? null,
              isCorrect: processedAnswers[index]?.isCorrect ?? false
            }))
          });
        } else {
          throw new Error(data.error || 'Failed to load review');
        }
      } catch (error) {
        Swal.fire('Error', 'Could not load quiz review!', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [navigate]);

  const handleBack = () => {
    Cookies.remove('quizId');
    Cookies.remove('quizDateTime');
    navigate('/adultQuizMain');
  };

  if (loading) {
    return (
      <div className="adultViewQuizTaken-loading">
        <div className="adultViewQuizTaken-loader"></div>
        <h2>Loading Review...</h2>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="adultViewQuizTaken-error">
        <h2>No Review Found</h2>
        <button onClick={handleBack} className="adultViewQuizTaken-backButton">
          Back to Management
        </button>
      </div>
    );
  }

  return (
    <div className="adultViewQuizTaken-container">
      <div className="adultViewQuizTaken-header">
        <button className="adultViewQuizTaken-backButton" onClick={handleBack}>
          ← Back
        </button>
        <div className="adultViewQuizTaken-titleGroup">
          <h1 className="adultViewQuizTaken-title">{quizData.name}</h1>
          <div className="adultViewQuizTaken-score">
            Score: {quizData.score}/{quizData.totalQuestions}
          </div>
          <div className="adultViewQuizTaken-date">
            Completed: {quizData.date} at {quizData.time}
          </div>
        </div>
      </div>

      <div className="adultViewQuizTaken-questionCard">
        <div className="adultViewQuizTaken-questionCounter">
          Question {currentQuestion + 1} of {quizData.questions.length}
        </div>

        <div className="adultViewQuizTaken-questionContent">
          <h3 className="adultViewQuizTaken-questionText">
            {quizData.questions[currentQuestion].text}
          </h3>

          {quizData.questions[currentQuestion].imgPath && (
            <div className="adultViewQuizTaken-imageContainer">
              <img 
                src={quizData.questions[currentQuestion].imgPath}
                alt="Question visual"
                className="adultViewQuizTaken-questionImage"
              />
            </div>
          )}
        </div>

        <div className="adultViewQuizTaken-options">
          {quizData.questions[currentQuestion].options.map((option, i) => {
            const isUserAnswer = i === quizData.questions[currentQuestion].userAnswer;
            const isCorrect = i === quizData.questions[currentQuestion].correct;

            return (
              <div
                key={i}
                className={`adultViewQuizTaken-option 
                  ${isCorrect ? 'correct' : ''}
                  ${isUserAnswer && !isCorrect ? 'incorrect' : ''}`}
              >
                <span className="adultViewQuizTaken-optionText">{option}</span>
                {isUserAnswer && (
                  <span className="adultViewQuizTaken-answerIndicator">
                    {isCorrect ? '✓' : '✕'}
                  </span>
                )}
                {isCorrect && <span className="adultViewQuizTaken-correctMarker">Correct Answer</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="adultViewQuizTaken-navigation">
        <button
          className="adultViewQuizTaken-navButton"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          Previous
        </button>
        <button
          className="adultViewQuizTaken-navButton"
          disabled={currentQuestion === quizData.questions.length - 1}
          onClick={() => setCurrentQuestion(prev => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdultViewQuizTakenPage;