import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdultQuizMainPage.css';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
const apiUrl = process.env.REACT_APP_API_URL;

const AdultQuizMainPage = () => {
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
            username: Cookies.get("childUsername")
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

  const handleViewQuiz = (quizId) => {
    Cookies.set("quizId", quizId);
    navigate(`/adultViewQuiz`);
  };

  const handleQuizReview = (quizId, datetimeTaken) => {
    Cookies.set("quizId", quizId);
    Cookies.set("quizDateTime", datetimeTaken);
    navigate('/adultViewQuizTaken');
  };

  return (
    <div className="adultQuizMain-container">
      <button 
        className="adultQuizMain-backButton" 
        onClick={() => navigate("/adultJoinChildSession")}
      >
        &larr; Back to Dashboard
      </button>

      <div className="adultQuizMain-header">
        <h1 className="adultQuizMain-title">Manage Quizzes</h1>
        <button
          className="adultQuizMain-createButton"
          onClick={() => navigate('/adultMakeQuiz')}
        >
          + Create New Quiz
        </button>
      </div>

      {loading && (
        <div className="adultQuizMain-loading">
          Loading quizzes...
        </div>
      )}

      {error && (
        <div className="adultQuizMain-error">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="adultQuizMain-section">
            <h2 className="adultQuizMain-subtitle">Created Quizzes</h2>
            <div className="adultQuizMain-list">
              {quizzes.availableQuizzes.length > 0 ? (
                quizzes.availableQuizzes.map(quiz => (
                  <div key={quiz.quizId} className="adultQuizMain-card">
                    <div className="adultQuizMain-cardHeader">
                      <h3 className="adultQuizMain-quizName">{quiz.quizName}</h3>
                    </div>
                    <p className="adultQuizMain-description">{quiz.quizDescription}</p>
                    <button 
                      className="adultQuizMain-viewButton"
                      onClick={() => handleViewQuiz(quiz.quizId)}
                    >
                      View Quiz
                    </button>
                  </div>
                ))
              ) : (
                <p className="adultQuizMain-emptyMessage">No quizzes created yet</p>
              )}
            </div>
          </div>

          <div className="adultQuizMain-section">
            <h2 className="adultQuizMain-subtitle">Attempt History</h2>
            <div className="adultQuizMain-list">
              {quizzes.takenQuizzes.length > 0 ? (
                quizzes.takenQuizzes.map((attempt) => {
                  const quiz = quizzes.availableQuizzes.find(q => q.quizId === attempt.quizId);
                  if (!quiz) return null;
                  
                  return (
                    <div key={`${attempt.quizId}-${attempt.datetimeTaken}`} 
                         className="adultQuizMain-card adultQuizMain-attemptCard">
                      <div className="adultQuizMain-attemptInfo">
                        <h3 className="adultQuizMain-quizName">{quiz.quizName}</h3>
                        <p className="adultQuizMain-attemptDate">
                          Attempted on: {new Date(attempt.datetimeTaken).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        className="adultQuizMain-reviewButton"
                        onClick={() => handleQuizReview(attempt.quizId, attempt.datetimeTaken)}
                      >
                        Review Attempt
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="adultQuizMain-emptyMessage">No attempts recorded</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdultQuizMainPage;