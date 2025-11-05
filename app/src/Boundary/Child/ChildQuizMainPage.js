import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChildQuizMainPage.css';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const ChildQuizMainPage = () => {
  const [quizzes, setQuizzes] = useState({
    availableQuizzes: [],
    takenQuizzes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${apiUrl}/quiz/getQuizList`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            username: Cookies.get("username")
          })
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        setQuizzes({
          availableQuizzes: Array.isArray(data.availableQuizzes) ? data.availableQuizzes : [],
          takenQuizzes: Array.isArray(data.takenQuizzes) 
          ? data.takenQuizzes.map(q => ({
              quizId: q.quizId,
              datetimeTaken: q.datetimeTaken
            })) 
          : []
        });
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError(error.message);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to load quizzes. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleQuizStart = (quizId) => {
    navigate(`/childQuizQuestion`);
    Cookies.set("quizId", quizId);
  };

  const handleQuizReview = (quizId, datetimeTaken) => {
    Cookies.set("quizId", quizId);
    Cookies.set("quizDateTime", datetimeTaken);
    navigate('/childQuizReview');
  };

  return (
    <div className="childQuizMain-container">
      {/* BACK BUTTON (Always visible) */}
      <button 
        className="childQuizMain-backButton" 
        onClick={() => navigate('/childHomepage')}
      >
        ⬅️ Back to Fun Zone
      </button>
      
      {/* TITLE (Always visible) */}
      <h1 className="childQuizMain-title">🌈 Fun Quizzes! 🌟</h1>

      {/* LOADING STATE */}
      {loading && (
        <div className="childQuizMain-loading">
          Loading quizzes...
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="childQuizMain-error">
          Error: {error}
        </div>
      )}

      {/* QUIZ LISTS (Only shown when not loading and no error) */}
      {!loading && !error && (
        <>
          <div className="childQuizMain-section">
            <h2 className="childQuizMain-subtitle">New Quizzes</h2>
            <div className="childQuizMain-list">
              {quizzes.availableQuizzes.filter(q => 
              !quizzes.takenQuizzes.some(taken => taken.quizId === q.quizId)
              ).length > 0 ? (
              quizzes.availableQuizzes.filter(q => 
              !quizzes.takenQuizzes.some(taken => taken.quizId === q.quizId)).map(quiz => (
                  <div key={quiz.quizId} className="childQuizMain-card">
                    <h3 className="childQuizMain-quizName">{quiz.quizName}</h3>
                    <p className="childQuizMain-description">{quiz.quizDescription}</p>
                    <button 
                      className="childQuizMain-startButton"
                      onClick={() => handleQuizStart(quiz.quizId)}
                    >
                      Start Adventure! 🚀
                    </button>
                  </div>
                ))
              ) : (
                <div className="childQuizMain-emptyContainer">
                  <p className="childQuizMain-emptyMessage">No new quizzes available! Come back later for more fun!</p>
                </div>
              )}
            </div>
          </div>

          <div className="childQuizMain-section">
            <h2 className="childQuizMain-subtitle">Completed Quizzes</h2>
            <div className="childQuizMain-list">
              {quizzes.takenQuizzes.length > 0 ? (
                quizzes.takenQuizzes.map((attempt) => {
                  const quiz = quizzes.availableQuizzes.find(q => q.quizId === attempt.quizId);
                  if (!quiz) return null;
                  
                  return (
                    <div key={`${attempt.quizId}-${attempt.datetimeTaken}`} 
                         className="childQuizMain-card childQuizMain-completed">
                      <div className="childQuizMain-completedBadge">✅</div>
                      <h3 className="childQuizMain-quizName">{quiz.quizName}</h3>
                      <p className="childQuizMain-description">
                        Completed on: {new Date(attempt.datetimeTaken).toLocaleString()}
                      </p>
                      <div className="childQuizMain-buttonGroup">
                        <button 
                          className="childQuizMain-retryButton"
                          onClick={() => handleQuizStart(quiz.quizId)}
                        >
                          Try Again! 🔄
                        </button>
                        <button 
                          className="childQuizMain-reviewButton"
                          onClick={() => handleQuizReview(attempt.quizId, attempt.datetimeTaken)}
                        >
                          Review Quiz 🔍
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="childQuizMain-emptyContainer">
                  <p className="childQuizMain-emptyMessage">No completed quizzes yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChildQuizMainPage;