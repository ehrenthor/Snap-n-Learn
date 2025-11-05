import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChildQuizReviewPage.css';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const apiUrl = process.env.REACT_APP_API_URL;

const ChildQuizReviewPage = () => {
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
            username: Cookies.get('username'),
            quizId: Cookies.get('quizId'),
            datetimeTaken: Cookies.get('quizDateTime')
          })
        });

        const data = await response.json();
        if (response.ok) {
          const quizDetails = data.quizDetails[0];
          const takenDetails = data.quizTakenDetails[0];

          // Process answers into a map using qNo
          const processedAnswers = {};
          takenDetails.answers.forEach(([qNo, answer, correctness]) => {
            processedAnswers[qNo - 1] = {
              selected: answer,
              isCorrect: correctness === 'T'
            };
          });

          // Format datetime
          const datetimeTaken = new Date(takenDetails.datetimeTaken);
          
          setQuizData({
            name: quizDetails.quizName,
            date: datetimeTaken.toLocaleDateString('en-US', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            }),
            time: datetimeTaken.toLocaleTimeString(),
            questions: quizDetails.questions.questions.map((question, index) => ({
              ...question,
              userAnswer: processedAnswers[index]?.selected ?? null,
              isCorrect: processedAnswers[index]?.isCorrect ?? false
            })),
            score: takenDetails.answers.filter(a => a[2] === 'T').length,
            totalQuestions: quizDetails.questions.questions.length
          });
        } else {
          throw new Error(data.error || 'Failed to load review');
        }
      } catch (error) {
        console.log(error)
        Swal.fire('Oops! 🌈', 'Could not load quiz review!', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [navigate]);

  const handleBackToMain = () => {
    Cookies.remove('quizId');
    Cookies.remove('quizDateTime')
    navigate('/childQuizMain');
  };

  const ScoreHeader = () => (
    <div className="childQuizReview-scoreHeader">
      <div className="childQuizReview-scoreBadge">
        🏆 {quizData?.score}/{quizData?.totalQuestions} Correct!
      </div>
      <div className="childQuizReview-date">
        {quizData?.date} at {quizData?.time}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="childQuizReview-loading">
        <div className="childQuizReview-loader">🎠</div>
        <h2>Loading Your Adventure Review...</h2>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="childQuizReview-error">
        <h2>Oops! No Review Found 🌈</h2>
        <button onClick={handleBackToMain} className="childQuizReview-backButton">
          Back to Quizzes 🏡
        </button>
      </div>
    );
  }

  return (
    <div className="childQuizReview-container">
      <div className="childQuizReview-header">
        <h1 className="childQuizReview-title">
          🦉 {quizData?.name} Review 🎉
          <ScoreHeader />        
        </h1>
      </div>

      <div className="childQuizReview-questionCard">
        <div className="childQuizReview-questionCounter">
          🌈 Question {currentQuestion + 1} of {quizData.questions.length}
        </div>

        <h3 className="childQuizReview-questionText">
          🐾 {quizData.questions[currentQuestion].text}
        </h3>

        {quizData.questions[currentQuestion].imgPath && (
          <div className="childQuizReview-imageContainer">
            <img 
              src={quizData.questions[currentQuestion].imgPath}
              alt="Question visual"
              className="childQuizReview-questionImage"
            />
          </div>
        )}

        <div className="childQuizReview-options">
          {quizData.questions[currentQuestion].options.map((option, i) => {
            const isUserAnswer = i === quizData.questions[currentQuestion].userAnswer;
            const isCorrectAnswer = i === quizData.questions[currentQuestion].correct;

            return (
              <div
                key={i}
                className={`childQuizReview-option 
                  ${isCorrectAnswer ? 'correct' : ''}
                  ${isUserAnswer ? (isCorrectAnswer ? 'correct' : 'incorrect') : ''}`}
              >
                <span className="childQuizReview-optionEmoji">
                  {['🐶', '🐱', '🐼', '🐸'][i % 4]}
                </span>
                <span className="childQuizReview-optionText">{option}</span>
                {isUserAnswer && (
                  <span className="childQuizReview-answerIndicator">
                    {isCorrectAnswer ? '✅' : '❌'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="childQuizReview-navigation">
        <button
          className="childQuizReview-navButton childQuizReview-prev"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          ← Previous
        </button>

        <button
          className="childQuizReview-navButton childQuizReview-mainButton"
          onClick={handleBackToMain}
        >
          🏡 Back to Quizzes
        </button>

        <button
          className="childQuizReview-navButton childQuizReview-next"
          disabled={currentQuestion === quizData.questions.length - 1}
          onClick={() => setCurrentQuestion(prev => prev + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default ChildQuizReviewPage;