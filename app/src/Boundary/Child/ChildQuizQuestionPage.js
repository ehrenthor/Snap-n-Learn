import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChildQuizQuestionPage.css';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import Lottie from 'lottie-react';
import celebrationAnimation from '../../Assets/celebration.json';
import sadAnimation from '../../Assets/sad.json';
const apiUrl = process.env.REACT_APP_API_URL;

const ChildQuizQuestionPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showIncorrectAnimation, setShowIncorrectAnimation] = useState(false); 
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
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
        Swal.fire('Oops! 🦄', 'Failed to load quiz! Please try again.', 'error');
        navigate("/childQuizMain");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (!submittedQuestions.includes(questionIndex)) {
      setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    }
  };

  const calculateProgress = () => {
    return (submittedQuestions.length / (quiz?.questions?.length || 1)) * 100;
  };

  const handleNextQuestion = () => {
    if (!submittedQuestions.includes(currentQuestion)) {
      if (answers[currentQuestion] === undefined) {
        Swal.fire('Wait! 🐾', 'Please select an answer before continuing!', 'warning');
        return;
      }
  
      // Check if answer is correct
      const isCorrect = answers[currentQuestion] === quiz.questions[currentQuestion].correct;
      
      setSubmittedQuestions(prev => [...prev, currentQuestion]);
      
      // Show appropriate animation
      if (isCorrect) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      } else {
        setShowIncorrectAnimation(true);
        setTimeout(() => setShowIncorrectAnimation(false), 2000);
      }
    } else {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    const username = Cookies.get('username');
    const formattedAnswers = Object.entries(answers).map(([qIndexStr, optionIndex]) => {
      const qIndex = parseInt(qIndexStr);
      const question = quiz.questions[qIndex];
      const isCorrect = optionIndex === question.correct;
      return [qIndex + 1, optionIndex, isCorrect ? 'T' : 'F'];
    });

    const correctAnswersCount = formattedAnswers.filter(answer => answer[2] === 'T').length;

    try {
      const response = await fetch(`${apiUrl}/quiz/insertQuizResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          username,
          answers: formattedAnswers
        })
      });

      if (!response.ok) throw new Error('Submission failed');

      Cookies.set('quizName', quiz.name);
      Cookies.set('quizTotal', quiz.questions.length.toString());
      Cookies.set('quizScore', correctAnswersCount.toString());
      navigate("/childQuizResult");
    } catch (error) {
      Swal.fire('Oops! 🌈', 'Failed to launch answers! Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="childQuizQuestion-loading">
        <div className="childQuizQuestion-loader">🍭</div>
        <h2>Getting Your Quiz Ready...</h2>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="childQuizQuestion-error">
        <h2>Oops! No Quiz Found 🎪</h2>
        <p>Let's go back and pick another one!</p>
      </div>
    );
  }

  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isSubmitted = submittedQuestions.includes(currentQuestion);

  return (
    <div className="childQuizQuestion-container">
      {showConfetti && (<Lottie animationData={celebrationAnimation} className="childQuizQuestion-confettiAnimation" />)}
      
      {showIncorrectAnimation && (<Lottie animationData={sadAnimation} className="childQuizQuestion-incorrectAnimation"/>)}

      <div className="childQuizQuestion-header">
        <div className="childQuizQuestion-title">
          <h1>🎮 {quiz.name} Challenge! 🏆</h1>
          <div className="childQuizQuestion-progressBar">
            <div 
              className="childQuizQuestion-progressFill"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="childQuizQuestion-questionCard">
        <div className="childQuizQuestion-questionCounter">
          <span>🌈 Question {currentQuestion + 1} of {quiz.questions.length}</span>
        </div>
        
        <h3 className="childQuizQuestion-questionText">
          🦉 {quiz.questions[currentQuestion].text}
        </h3>

        {quiz.questions[currentQuestion].imgPath && (
          <div className="childQuizQuestion-imageContainer">
            <img 
              src={quiz.questions[currentQuestion].imgPath}
              alt="Question visual"
              className="childQuizQuestion-questionImage"
            />
          </div>
        )}

        <div className="childQuizQuestion-options">
          {quiz.questions[currentQuestion].options.map((option, i) => {
            const optionText = Array.isArray(option) ? option[0] : option;
            const isCorrect = i === quiz.questions[currentQuestion].correct;
            const isSelected = answers[currentQuestion] === i;
            const showResults = submittedQuestions.includes(currentQuestion);

            return (
              <button
                key={i}
                className={`childQuizQuestion-option 
                  ${isSelected ? 'selected' : ''}
                  ${showResults ? (isCorrect ? 'correct' : (isSelected ? 'incorrect' : '')) : ''}`}
                onClick={() => handleAnswerSelect(currentQuestion, i)}
                disabled={showResults}
              >
                <span className="childQuizQuestion-optionEmoji">{['🐶', '🐱', '🐼', '🐸'][i % 4]}</span>
                <span className="childQuizQuestion-optionText">{optionText}</span>
                {showResults && isCorrect && (
                  <span className="childQuizQuestion-correctIndicator">✅</span>
                )}
                {showResults && isSelected && !isCorrect && (
                  <span className="childQuizQuestion-incorrectIndicator">❌</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="childQuizQuestion-navigation">
        <button
          className="childQuizQuestion-navButton childQuizQuestion-prev"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          ← Previous
        </button>
        
        <button
          className="childQuizQuestion-navButton childQuizQuestion-next"
          onClick={handleNextQuestion}
        >
          {isSubmitted ? 
            (isLastQuestion ? 'Finish 🚀' : 'Next Question ➡️') : 
            (isLastQuestion ? 'Check Answer ✔️' : 'Check Answer ✔️')}
        </button>
      </div>
    </div>
  );
};

export default ChildQuizQuestionPage;